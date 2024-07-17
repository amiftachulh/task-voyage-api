import { z } from "zod"
import { createQuerySchema } from "../utils"

const allowedFilters = ["email", "username", "displayName"]
const allowedSorts = ["email", "username", "displayName", "createdAt"]

export const updateUserSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_.]+$/),
  displayName: z.string().min(1).max(50).nullable(),
})

export const usersQuerySchema = createQuerySchema(allowedFilters, allowedSorts)
