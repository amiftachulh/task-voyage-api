import { z } from "zod"

export const registerSchema = z
  .object({
    email: z.string().trim().email(),
    username: z
      .string()
      .trim()
      .min(3)
      .max(32)
      .regex(/^[a-zA-Z0-9_.]+$/),
    displayName: z
      .string()
      .trim()
      .max(50)
      .transform((v) => v || null)
      .nullable(),
    password: z
      .string()
      .min(8)
      .max(64)
      .regex(/^[a-zA-Z0-9!@#$%^&*()\-=_+[\]{}\\|;:'",./<>? ]+$/),
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
  sub: z.string(),
  exp: z.number(),
  jti: z.string(),
  role: z.string(),
})

export type JwtPayloadSchema = z.infer<typeof jwtPayloadSchema>
