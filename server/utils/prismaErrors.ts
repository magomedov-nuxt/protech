import { Prisma } from "@prisma/client";
import { createError } from "h3";

type PrismaErrorCode = "P2002" | "P2003" | "P2025";
type PrismaErrorOverride = string | {
  message: string;
  statusCode?: number;
};
type PrismaErrorMessages = Partial<Record<PrismaErrorCode, PrismaErrorOverride>>;

const defaultMessages: Record<PrismaErrorCode, string> = {
  P2002: "Запись с такими данными уже существует",
  P2003: "Связанная запись не найдена или используется другой сущностью",
  P2025: "Запись не найдена"
};

const statusByCode: Record<PrismaErrorCode, number> = {
  P2002: 409,
  P2003: 400,
  P2025: 404
};

export function toPrismaHttpError(
  error: unknown,
  messages: PrismaErrorMessages = {}
) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const code = error.code as PrismaErrorCode;

    if (code in statusByCode) {
      const override = messages[code];

      return createError({
        statusCode:
          typeof override === "object" && override.statusCode
            ? override.statusCode
            : statusByCode[code],
        message:
          typeof override === "string"
            ? override
            : override?.message ?? defaultMessages[code]
      });
    }
  }

  return null;
}

export function throwPrismaError(
  error: unknown,
  messages?: PrismaErrorMessages
): never {
  const httpError = toPrismaHttpError(error, messages);

  if (httpError) {
    throw httpError;
  }

  throw error;
}
