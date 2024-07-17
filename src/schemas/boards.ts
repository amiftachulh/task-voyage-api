import { z } from "zod"
import { createQuerySchema } from "../utils"

const allowedFilters = ["title", "description"]
const allowedSorts = ["title", "description", "createdAt"]

export const boardSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).transform(v => v || null).nullable(),
})

export const boardsQuerySchema = createQuerySchema(allowedFilters, allowedSorts)
