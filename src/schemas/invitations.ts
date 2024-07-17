import { z } from "zod"

export const invitationsSchema = z.object({
  userId: z.string(),
  boardId: z.string(),
  role: z.enum(["viewer", "editor", "moderator"]),
})

export const receiveInvitationsSchema = z.object({
  accept: z.boolean(),
})
