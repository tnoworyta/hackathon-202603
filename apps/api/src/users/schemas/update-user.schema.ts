import { Static, Type } from "@sinclair/typebox";

export const updateUserSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  email: Type.Optional(Type.String({ format: "email" })),
  banned: Type.Optional(Type.Boolean()),
  banReason: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  banExpires: Type.Optional(
    Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
  ),
});

export type UpdateUserBody = Static<typeof updateUserSchema>;
