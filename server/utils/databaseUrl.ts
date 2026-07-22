type DatabaseEnv = Record<string, string | undefined>;

const DEFAULT_POSTGRES_PORT = "5432";

const DATABASE_URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL"
];

const HOST_KEYS = ["DATABASE_HOST", "DB_HOST", "POSTGRES_HOST", "PGHOST"];
const PORT_KEYS = ["DATABASE_PORT", "DB_PORT", "POSTGRES_PORT", "PGPORT"];
const USER_KEYS = ["DATABASE_USER", "DB_USER", "DB_USERNAME", "POSTGRES_USER", "PGUSER"];
const PASSWORD_KEYS = ["DATABASE_PASSWORD", "DB_PASSWORD", "POSTGRES_PASSWORD", "PGPASSWORD"];
const NAME_KEYS = [
  "DATABASE_NAME",
  "DATABASE_DB",
  "DATABASE_DB_NAME",
  "DB_NAME",
  "DB_DATABASE",
  "POSTGRES_DB",
  "PGDATABASE"
];
const SSL_MODE_KEYS = ["DATABASE_SSLMODE", "DB_SSLMODE", "PGSSLMODE"];
const SSL_ENABLED_KEYS = ["DATABASE_SSL", "DB_SSL", "POSTGRES_SSL"];
const SCHEMA_KEYS = ["DATABASE_SCHEMA", "DB_SCHEMA", "PGSCHEMA"];

type EnvValue = {
  key: string;
  value: string;
};

type ComponentConfig = {
  host?: EnvValue;
  port?: EnvValue;
  user?: EnvValue;
  password?: EnvValue;
  name?: EnvValue;
  sslMode?: EnvValue;
  sslEnabled?: EnvValue;
  schema?: EnvValue;
  presentKeys: string[];
};

type HostAndPort = {
  host: string;
  port?: string;
  portSource: string;
};

function cleanEnvValue(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1).trim() || undefined;
  }

  return trimmed;
}

function readFirstEnv(env: DatabaseEnv, keys: string[]): EnvValue | undefined {
  for (const key of keys) {
    const value = cleanEnvValue(env[key]);

    if (value) {
      return { key, value };
    }
  }

  return undefined;
}

function readComponentConfig(env: DatabaseEnv): ComponentConfig {
  const values = {
    host: readFirstEnv(env, HOST_KEYS),
    port: readFirstEnv(env, PORT_KEYS),
    user: readFirstEnv(env, USER_KEYS),
    password: readFirstEnv(env, PASSWORD_KEYS),
    name: readFirstEnv(env, NAME_KEYS),
    sslMode: readFirstEnv(env, SSL_MODE_KEYS),
    sslEnabled: readFirstEnv(env, SSL_ENABLED_KEYS),
    schema: readFirstEnv(env, SCHEMA_KEYS)
  };

  return {
    ...values,
    presentKeys: Object.values(values)
      .filter((value): value is EnvValue => Boolean(value))
      .map(({ key }) => key)
  };
}

function validatePort(value: string, source: string) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${source} must be a numeric PostgreSQL port`);
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${source} must be between 1 and 65535`);
  }

  return String(port);
}

function splitHostAndPort(hostValue: EnvValue, portValue?: EnvValue): HostAndPort {
  const host = hostValue.value;

  if (host.startsWith("[")) {
    const ipv6WithPort = /^\[([^\]]+)\](?::(.+))?$/.exec(host);

    if (ipv6WithPort?.[1]) {
      return {
        host: `[${ipv6WithPort[1]}]`,
        port: portValue?.value ?? ipv6WithPort[2],
        portSource: portValue?.key ?? hostValue.key
      };
    }
  }

  if (!portValue) {
    const hostWithPort = /^([^:]+):(.+)$/.exec(host);

    if (hostWithPort?.[1]) {
      return {
        host: hostWithPort[1],
        port: hostWithPort[2],
        portSource: hostValue.key
      };
    }
  }

  return {
    host,
    port: portValue?.value,
    portSource: portValue?.key ?? hostValue.key
  };
}

function normalizeHost(host: string, source: string) {
  if (/[/?#@]/.test(host)) {
    throw new Error(`${source} must contain only a PostgreSQL host, not a full URL`);
  }

  if (host.includes(":") && !host.startsWith("[") && !host.endsWith("]")) {
    return `[${host}]`;
  }

  return host;
}

function readSslMode(config: ComponentConfig) {
  if (config.sslMode) {
    return config.sslMode.value;
  }

  if (!config.sslEnabled) {
    return undefined;
  }

  const enabled = config.sslEnabled.value.toLowerCase();

  if (["1", "true", "yes", "require", "required"].includes(enabled)) {
    return "require";
  }

  if (["0", "false", "no", "disable", "disabled"].includes(enabled)) {
    return "disable";
  }

  throw new Error(`${config.sslEnabled.key} must be true, false, require or disable`);
}

function normalizeDatabaseUrl(rawUrl: string, source: string) {
  const value = cleanEnvValue(rawUrl);

  if (!value) {
    throw new Error(`${source} is empty`);
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch (error) {
    const reason = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(
      `Invalid ${source}${reason}. Expected postgresql://user:password@host:port/database. ` +
        "If the password contains special characters, percent-encode them or use separate DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME variables.",
      { cause: error }
    );
  }

  if (!["postgresql:", "postgres:"].includes(url.protocol)) {
    throw new Error(`${source} must start with postgresql:// or postgres://`);
  }

  if (!url.hostname) {
    throw new Error(`${source} must include a PostgreSQL host`);
  }

  if (!url.pathname || url.pathname === "/") {
    throw new Error(`${source} must include a database name`);
  }

  if (url.hash) {
    throw new Error(`${source} must not include a URL fragment. Encode # as %23 if it is part of the password.`);
  }

  if (!url.port) {
    url.port = DEFAULT_POSTGRES_PORT;
  }

  return url.toString();
}

function buildDatabaseUrlFromComponents(config: ComponentConfig) {
  if (!config.host || !config.user || !config.password || !config.name) {
    return undefined;
  }

  const { host, port, portSource } = splitHostAndPort(config.host, config.port);
  const normalizedHost = normalizeHost(host, config.host.key);
  const normalizedPort = validatePort(port ?? DEFAULT_POSTGRES_PORT, portSource);
  const query = new URLSearchParams();
  const sslMode = readSslMode(config);

  if (sslMode) {
    query.set("sslmode", sslMode);
  }

  if (config.schema) {
    query.set("schema", config.schema.value);
  }

  const credentials = [
    encodeURIComponent(config.user.value),
    encodeURIComponent(config.password.value)
  ].join(":");
  const path = encodeURIComponent(config.name.value);
  const search = query.size > 0 ? `?${query.toString()}` : "";

  return normalizeDatabaseUrl(
    `postgresql://${credentials}@${normalizedHost}:${normalizedPort}/${path}${search}`,
    "database component variables"
  );
}

export function getDatabaseUrl(env: DatabaseEnv = process.env) {
  const componentConfig = readComponentConfig(env);
  const componentUrl = buildDatabaseUrlFromComponents(componentConfig);

  if (componentUrl) {
    return componentUrl;
  }

  const configuredUrl = readFirstEnv(env, DATABASE_URL_KEYS);

  if (configuredUrl) {
    return normalizeDatabaseUrl(configuredUrl.value, configuredUrl.key);
  }

  if (componentConfig.presentKeys.length > 0) {
    throw new Error(
      `Incomplete database configuration. Found ${componentConfig.presentKeys.join(", ")}, ` +
        "but expected DB_HOST, DB_USER, DB_PASSWORD and DB_NAME, or a complete DATABASE_URL."
    );
  }

  throw new Error(
    "Database connection is not configured. Set DATABASE_URL or DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME."
  );
}
