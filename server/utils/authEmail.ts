import { sendYandexMail } from "./yandexMail";

type VerificationEmailInput = {
  url: string;
  user: {
    email: string;
    name?: string | null;
  };
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendEmailVerification({ url, user }: VerificationEmailInput) {
  const displayName = user.name?.trim() || user.email;
  const safeName = escapeHtml(displayName);
  const safeUrl = escapeHtml(url);

  try {
    await sendYandexMail({
      to: user.email,
      subject: "Подтвердите почту для ProTech",
      text: [
        `Здравствуйте, ${displayName}!`,
        "",
        "Подтвердите email, чтобы войти в аккаунт ПроТех76:",
        url,
        "",
        "Если вы не создавали аккаунт, просто проигнорируйте это письмо."
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
          <h1 style="margin:0 0 16px;font-size:24px">Подтвердите почту</h1>
          <p>Здравствуйте, ${safeName}!</p>
          <p>Нажмите кнопку ниже, чтобы подтвердить email и войти в аккаунт ProTech.</p>
          <p style="margin:24px 0">
            <a href="${safeUrl}" style="display:inline-block;border-radius:999px;background:#059669;color:#fff;padding:12px 20px;text-decoration:none;font-weight:700">
              Подтвердить email
            </a>
          </p>
          <p style="color:#71717a;font-size:14px">Если кнопка не открывается, скопируйте ссылку:</p>
          <p style="word-break:break-all;color:#047857;font-size:14px">${safeUrl}</p>
          <p style="color:#71717a;font-size:14px">Если вы не создавали аккаунт, просто проигнорируйте это письмо.</p>
        </div>
      `
    });
  } catch (error) {
    console.error("Failed to send verification email", {
      email: user.email,
      error
    });
    throw error;
  }
}
