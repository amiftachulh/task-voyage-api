import { Hono } from "hono"
import { ObjectId } from "mongodb"
import { Card } from "../config/db"
import { authenticate, validate } from "../middlewares"
import {
  createCardSchema,
  deleteCardSchema,
  moveCardSchema,
  updateCardSchema,
} from "../schemas/cards"
import { res } from "../utils"
import { checkBoardWriteAccess } from "../utils/boards"

const cards = new Hono()
  .use(authenticate)
  /**
   * Create a card.
   */
  .post("/", validate("json", createCardSchema), async (c) => {
    const body = c.req.valid("json")
    const authId = new ObjectId(c.get("auth").id)
    const boardId = new ObjectId(body.boardId)
    const board = await checkBoardWriteAccess(boardId, authId)
    if (!board) return c.json(res("Board not found."), 404)

    const listId = new ObjectId(body.listId)
    const now = new Date().toISOString()

    await Card.insertOne({
      title: body.title,
      description: body.description,
      boardId,
      listId,
      pos: body.pos,
      assignedTo: [],
      dueDate: null,
      activities: [
        {
          userId: authId,
          type: "desc",
          comment: "Task created",
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    })

    return c.json(res("Card created."), 201)
  })

  /**
   * Update a card.
   */
  .patch("/:id", validate("json", updateCardSchema), async (c) => {
    const { title, description, boardId } = c.req.valid("json")
    const board = await checkBoardWriteAccess(new ObjectId(boardId), new ObjectId(c.get("auth").id))
    if (!board) return c.json(res("Board not found."), 404)

    const result = await Card.updateOne(
      { _id: new ObjectId(c.req.param("id")) },
      { $set: { title, description, updatedAt: new Date().toISOString() } }
    )
    if (result.modifiedCount === 0) return c.json(res("Card not found."), 404)
    return c.json(res("Card updated."))
  })

  /**
   * Delete a card.
   */
  .delete("/:id", validate("json", deleteCardSchema), async (c) => {
    const { boardId } = c.req.valid("json")
    const board = await checkBoardWriteAccess(new ObjectId(boardId), new ObjectId(c.get("auth").id))
    if (!board) return c.json(res("Board not found."), 404)

    const result = await Card.deleteOne({ _id: new ObjectId(c.req.param("id")) })
    if (result.deletedCount === 0) return c.json(res("Card not found."), 404)
    return c.json(res("Card deleted."))
  })

  /**
   * Move a card.
   */
  .patch("/:id/move", validate("json", moveCardSchema), async (c) => {
    const { boardId, listId, pos } = c.req.valid("json")
    const board = await checkBoardWriteAccess(new ObjectId(boardId), new ObjectId(c.get("auth").id))
    if (!board) return c.json(res("Board not found."), 404)

    const result = await Card.updateOne(
      { _id: new ObjectId(c.req.param("id")) },
      {
        $set: {
          listId: new ObjectId(listId),
          pos,
          updatedAt: new Date().toISOString(),
        },
      }
    )

    if (result.modifiedCount === 0) return c.json(res("Card not found."), 404)
    return c.json(res("Card moved."))
  })

export default cards
