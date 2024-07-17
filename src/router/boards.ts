import { Hono } from "hono"
import { ObjectId } from "mongodb"
import { Board, Card, List } from "../config/db"
import { authenticate, validate } from "../middlewares"
import { boardSchema, boardsQuerySchema } from "../schemas/boards"
import { res } from "../utils"

const boards = new Hono()
  .use(authenticate)
  /**
   * Create a board.
   */
  .post("/", validate("json", boardSchema), async (c) => {
    const { title, description } = c.req.valid("json")
    const now = new Date().toISOString()
    await Board.insertOne({
      title,
      description,
      members: [{ _id: new ObjectId(c.get("auth").id), role: "owner" }],
      createdAt: now,
      updatedAt: now,
    })
    return c.json(res("Board created."), 201)
  })

  /**
   * Get boards.
   */
  .get("/", validate("query", boardsQuerySchema), async (c) => {
    const authId = new ObjectId(c.get("auth").id)
    const { q, filter, sort } = c.req.valid("query")
    const query =
      q && filter
        ? {
            $or: filter.map((key) => ({ [key]: { $regex: q, $options: "i" } })),
          }
        : undefined

    const boards = await Board.aggregate([
      {
        $match: {
          members: { $elemMatch: { _id: authId } },
          ...query,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "members._id",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                email: 1,
                username: 1,
                displayName: 1,
              },
            },
          ],
          as: "membersDetails",
        },
      },
      { $sort: sort ?? { _id: 1 } },
      { $limit: 10 },
    ]).toArray()

    return c.json(boards)
  })

  /**
   * Get a board by id.
   */
  .get("/:id", async (c) => {
    const authId = new ObjectId(c.get("auth").id)
    const boardId = new ObjectId(c.req.param("id"))
    const board = await Board.aggregate([
      {
        $match: {
          _id: boardId,
          members: { $elemMatch: { _id: authId } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "members._id",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                email: 1,
                username: 1,
                displayName: 1,
              },
            },
          ],
          as: "membersDetails",
        },
      },
    ]).toArray()
    if (board.length === 0) return c.json(res("Board not found."), 404)

    const [lists, cards] = await Promise.all([
      List.find({ boardId }).toArray(),
      Card.find({ boardId }).toArray(),
    ])

    return c.json({ ...board[0], lists, cards })
  })

  /**
   * Update a board by id.
   */
  .put("/:id", validate("json", boardSchema), async (c) => {
    const authId = new ObjectId(c.get("auth").id)
    const { title, description } = c.req.valid("json")
    const now = new Date().toISOString()
    const board = await Board.updateOne(
      {
        _id: new ObjectId(c.req.param("id")),
        $or: [{ owner: authId }, { moderators: authId }],
      },
      {
        $set: {
          title,
          description,
          updatedAt: now,
        },
      }
    )
    if (board.modifiedCount === 0) return c.json(res("Board not found."), 404)
    return c.json(res("Board updated."))
  })

  /**
   * Delete a board by id.
   */
  .delete("/:id", async (c) => {
    const authId = new ObjectId(c.get("auth").id)
    const board = await Board.deleteOne({
      _id: new ObjectId(c.req.param("id")),
      owner: authId,
    })
    if (board.deletedCount === 0) return c.json(res("Board not found."), 404)
    return c.json(res("Board deleted."))
  })

export default boards
