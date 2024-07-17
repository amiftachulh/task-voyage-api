import { ObjectId } from "mongodb"

export type UserCollection = {
  email: string
  username: string
  displayName: string | null
  password: string
  role: "admin" | "user"
  createdAt: string
  updatedAt: string
}

export type BoardRole = "owner" | "moderator" | "editor" | "viewer"

export type BoardCollection = {
  title: string
  description: string | null
  members: {
    _id: ObjectId
    role: BoardRole
  }[]
  createdAt: string
  updatedAt: string
}

export type InvitationCollection = {
  userId: ObjectId
  board: {
    _id: ObjectId
    title: string
    invitedBy: ObjectId
  }
  role: Exclude<BoardRole, "owner">
  invitedBy: ObjectId
  createdAt: string
}

export type ListCollection = {
  title: string
  boardId: ObjectId
  pos: number
}

export type CardCollection = {
  title: string
  description: string | null
  boardId: ObjectId
  listId: ObjectId
  pos: number
  assignedTo: ObjectId[]
  dueDate: string | null
  activities: Activity[]
  createdAt: string
  updatedAt: string
}

export type Activity = {
  userId: ObjectId
  type: "desc" | "assign" | "move" | "comment"
  description?: string
  assign?: ObjectId
  move?: {
    from: string
    to: string
  }
  comment?: string
  createdAt: string
}
