import type { H3Event } from "h3";
import { appendResponseHeader, createError, readValidatedBody, setResponseHeader } from "h3";
import type { z } from "zod";
import { auth } from "./auth";

type HeadersWithGetSetCookie = Headers & {
  getSetCookie?: () => string[];
};

function applyAuthResponseHeaders(event: H3Event, headers: Headers) {
  const setCookies = (headers as HeadersWithGetSetCookie).getSetCookie?.() ?? [];

  for (const cookie of setCookies) {
    appendResponseHeader(event, "set-cookie", cookie);
  }

  headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      if (!setCookies.length) {
        appendResponseHeader(event, "set-cookie", value);
      }
      return;
    }

    setResponseHeader(event, key, value);
  });
}

export async function getAuthSession(event: H3Event) {
  const session = await auth.api.getSession({
    headers: event.headers,
    returnHeaders: true
  });

  applyAuthResponseHeaders(event, session.headers);
  return session.response;
}

export async function requireUser(event: H3Event) {
  const session = await getAuthSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Вы не авторизованы"
    });
  }

  return {
    session,
    user: session.user,
    userId: session.user.id
  };
}

export async function validateBody<TSchema extends z.ZodType>(
  event: H3Event,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  const result = await readValidatedBody(event, (body) => schema.safeParse(body));

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Ошибка валидации данных",
      data: result.error.flatten((issue) => issue.message).fieldErrors
    });
  }

  return result.data;
}
