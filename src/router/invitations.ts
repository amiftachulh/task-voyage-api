import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { ObjectId } from "mongodb"
import { Board, Invitation, mongo } from "../config/db"
import { authenticate, validate } from "../middlewares"
import { invitationsSchema, receiveInvitationsSchema } from "../schemas/invitations"
import { res } from "../utils"

const invitations = new Hono()
  .use(authenticate)
  /**
   * Send an invitation to a user to join a board.
   */
  .post("/", validate("json", invitationsSchema), async (c) => {
    const authId = new ObjectId(c.get("auth").id)
    const body = c.req.valid("json")
    const userId = new ObjectId(body.userId)

    const board = await Board.findOne(
      { _id: new ObjectId(body.boardId), owner: authId },
      { projection: { _id: 1, title: 1, owner: 1 } }
    )
    if (!board) return c.json(res("Board not found."), 404)

    const invitation = await Invitation.findOne({ userId, "board._id": board._id })
    if (invitation) return c.json(res("Invitation already sent."), 409)

    await Invitation.insertOne({
      userId,
      board: {
        _id: board._id,
        title: board.title,
        invitedBy: authId,
      },
      role: body.role,
      invitedBy: authId,
      createdAt: new Date().toISOString(),
    })

    return c.json({ message: "Invitation sent." })
  })

  // Get all invitations for the authenticated user.
  .get("/", async (c) => {
    const authId = new ObjectId(c.get("auth").id)
    const invitations = await Invitation.find({ userId: authId }).toArray()
    return c.json(invitations)
  })

  /**
   * Accept or decline an invitation to join a board.
   */
  .delete("/:id", validate("json", receiveInvitationsSchema), async (c) => {
    const authId = new ObjectId(c.get("auth").id)
    const { accept } = c.req.valid("json")

    const invitation = await Invitation.findOne({
      _id: new ObjectId(c.req.param("id")),
      userId: authId,
    })
    if (!invitation) return c.json(res("Invitation not found."), 404)

    const session = mongo.startSession()

    try {
      await session.withTransaction(async () => {
        if (accept) {
          const board = await Board.updateOne(
            { _id: invitation.board._id },
            {
              $push: {
                members: { _id: authId, role: invitation.role },
              },
            }
          )
          if (board.modifiedCount === 0) {
            throw new HTTPException(404, { message: "Board not found." })
          }
        }

        const result = await Invitation.deleteOne({ _id: invitation._id })
        if (result.deletedCount === 0) {
          throw new HTTPException(404, { message: "Invitation not found." })
        }
      })
    } finally {
      await session.endSession()
    }

    return c.json(res(`Invitation ${accept ? "accepted" : "declined"}.`))
  })

export default invitations
