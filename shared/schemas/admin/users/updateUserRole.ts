import z from "zod";

export const userRoleSchema = z.enum(["USER", "ADMIN"], {
  message: "Некорректная роль пользователя"
});

export const updateUserRoleSchema = z.strictObject({
  role: userRoleSchema
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
