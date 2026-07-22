type PositiveIntegerEnvOptions = {
  min?: number;
  max?: number;
};

export function getPositiveIntegerEnv(
  name: string,
  fallback: number,
  options: PositiveIntegerEnvOptions = {}
) {
  const min = options.min ?? 1;
  const max = options.max ?? Number.MAX_SAFE_INTEGER;
  const value = Number(process.env[name]);

  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}
