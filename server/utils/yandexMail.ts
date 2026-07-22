import nodemailer from "nodemailer";
import type { SendMailOptions, Transporter } from "nodemailer";

type MailMessage = Pick<SendMailOptions, "html" | "subject" | "text" | "to">;

let transporter: Transporter | null = null;

function getEnv(name: string, fallbackName?: string) {
  return process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);
}

function getSmtpPort() {
  const value = Number(process.env.YANDEX_SMTP_PORT ?? 465);
  return Number.isInteger(value) && value > 0 ? value : 465;
}

function getSmtpTimeout() {
  const value = Number(process.env.YANDEX_SMTP_TIMEOUT_MS ?? 10_000);
  return Number.isInteger(value) && value > 0 ? value : 10_000;
}

function getSmtpSecure(port: number) {
  if (process.env.YANDEX_SMTP_SECURE === "false") {
    return false;
  }

  if (process.env.YANDEX_SMTP_SECURE === "true") {
    return true;
  }

  return port === 465;
}

function getFromAddress(user: string) {
  const from = process.env.YANDEX_SMTP_FROM?.trim();

  if (!from) {
    return user;
  }

  if (from.includes("@") || from.includes("<")) {
    return from;
  }

  const escapedName = from.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"");
  return `"${escapedName}" <${user}>`;
}

function getYandexMailConfig() {
  const user = getEnv("YANDEX_SMTP_USER", "YANDEXMAIL");
  const pass = getEnv("YANDEX_SMTP_PASSWORD", "YANDEXPASS");

  if (!user || !pass) {
    throw new Error("Yandex SMTP credentials are not configured");
  }

  const port = getSmtpPort();
  const timeout = getSmtpTimeout();

  return {
    from: getFromAddress(user),
    host: process.env.YANDEX_SMTP_HOST || "smtp.yandex.ru",
    pass,
    port,
    secure: getSmtpSecure(port),
    timeout,
    user
  };
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const config = getYandexMailConfig();

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    connectionTimeout: config.timeout,
    greetingTimeout: config.timeout,
    socketTimeout: config.timeout,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  return transporter;
}

export async function sendYandexMail(message: MailMessage) {
  const config = getYandexMailConfig();

  await getTransporter().sendMail({
    from: config.from,
    ...message
  });
}
