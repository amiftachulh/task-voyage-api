import { ObjectId } from "mongodb"
import { Board } from "../config/db"

export async function lastActivity(boardId: string) {
  try {
    return await Board.updateOne(
      { _id: new ObjectId(boardId) },
      { $set: { lastActivity: new Date().toISOString() } }
    )
  } catch (error) {
    return null
  }
}

export async function checkBoardWriteAccess(boardId: ObjectId, userId: ObjectId) {
  try {
    const board = await Board.findOne({
      _id: boardId,
      members: {
        $elemMatch: {
          _id: userId,
          role: { $in: ["owner", "moderator", "editor"] },
        },
      },
    })
    return board
  } catch (error) {
    return null
  }
}
