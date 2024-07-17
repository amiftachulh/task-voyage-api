import { Hono } from "hono"
import { ObjectId } from "mongodb"
import { List } from "../config/db"
import { authenticate, validate } from "../middlewares"
import { deleteListSchema, listSchema, moveListSchema, updateListSchema } from "../schemas/lists"
import { res } from "../utils"
import { checkBoardWriteAccess } from "../utils/boards"

const lists = new Hono()
  .use(authenticate)
  /**
   * Create a list in a board.
   */
  .post("/", validate("json", listSchema), async (c) => {
    const authId = new ObjectId(c.get("auth").id)
    const body = c.req.valid("json")
    const boardId = new ObjectId(body.boardId)
    const board = await checkBoardWriteAccess(boardId, authId)
    if (!board) return c.json(res("Board not found."), 404)

    await List.insertOne({
      title: body.title,
      boardId,
      pos: body.pos,
    })

    return c.json(res("List created."), 201)
  })

  /**
   * Update a list in a board.
   */
  .patch("/:id", validate("json", updateListSchema), async (c) => {
    const authId = new ObjectId(c.get("auth").id)
    const { title, boardId } = c.req.valid("json")
    const board = await checkBoardWriteAccess(new ObjectId(boardId), authId)
    if (!board) return c.json(res("Board not found."), 404)

    const result = await List.updateOne(
      { _id: new ObjectId(c.req.param("id")) },
      { $set: { title } }
    )
    if (result.modifiedCount === 0) return c.json(res("List not found."), 404)
    return c.json(res("List updated."))
  })

  /**
   * Delete a list in a board.
   */
  .delete("/:id", validate("json", deleteListSchema), async (c) => {
    const { boardId } = c.req.valid("json")
    const board = await checkBoardWriteAccess(new ObjectId(boardId), new ObjectId(c.get("auth").id))
    if (!board) return c.json(res("Board not found."), 404)

    const result = await List.deleteOne({ _id: new ObjectId(c.req.param("id")) })
    if (!result.deletedCount) return c.json(res("List not found."), 404)
    return c.json(res("List deleted."))
  })

  /**
   * Move list in a board
   */
  .patch("/:id/move", validate("json", moveListSchema), async (c) => {
    const { boardId, pos } = c.req.valid("json")
    const board = await checkBoardWriteAccess(new ObjectId(boardId), new ObjectId(c.get("auth").id))
    if (!board) return c.json(res("Board not found."), 404)

    const result = await List.updateOne({ _id: new ObjectId(c.req.param("id")) }, { $set: { pos } })
    if (result.modifiedCount === 0) return c.json(res("List not found."), 404)
    return c.json(res("List moved."))
  })

export default lists
