import { z } from "zod"

export const registerSchema = z
  .object({
    email: z.string().trim().email(),
    password: z
      .string()
      .min(8)
      .max(64)
      .regex(/^[ -~]+$/),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export const loginSchema = z.object({
  emailOrUsername: z.string(),
  password: z.string(),
})

export const jwtPayloadSchema = z.object({
  id: z.string(),
  exp: z.number(),
  jti: z.string(),
  role: z.string(),
})

export type JwtPayloadSchema = z.infer<typeof jwtPayloadSchema>
