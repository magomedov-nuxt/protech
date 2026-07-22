import z from "zod";

const localImagePathPattern = /^\/[a-z0-9][a-z0-9/_-]*\/[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp|gif)$/i;

function isSafeLocalImagePath(value: string) {
  return localImagePathPattern.test(value) && !value.includes("//") && !value.includes("..");
}

export const imagePathSchema = z
  .string("Ссылка на изображение необходима")
  .trim()
  .min(1, "Ссылка на изображение необходима")
  .max(1000, "Ссылка на изображение должна быть не более 1000 символов")
  .refine(
    (value) => {
      if (isSafeLocalImagePath(value)) {
        return true;
      }

      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Некорректная ссылка на изображение" },
  );
