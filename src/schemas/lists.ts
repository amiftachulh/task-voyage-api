import { z } from "zod"

export const listSchema = z.object({
  title: z.string().min(1, "Title is required."),
  boardId: z.string().min(1, "Board ID is required."),
  pos: z.number().gt(0, "Invalid list position."),
})
export const updateListSchema = listSchema.omit({ pos: true })
export const moveListSchema = listSchema.omit({ title: true })
export const deleteListSchema = listSchema.pick({ boardId: true })
