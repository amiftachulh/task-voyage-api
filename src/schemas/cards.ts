import { z } from "zod"

export const createCardSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().max(1000).nullable(),
  boardId: z.string().min(1, "Board ID is required."),
  listId: z.string().min(1, "List ID is required."),
  pos: z.number().gt(0, "Invalid card position."),
})
export const updateCardSchema = createCardSchema.omit({ listId: true, pos: true })
export const moveCardSchema = createCardSchema.omit({ title: true, description: true })
export const deleteCardSchema = createCardSchema.pick({ boardId: true })
