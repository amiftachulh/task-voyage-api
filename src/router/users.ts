import { Hono } from "hono"
import { ObjectId } from "mongodb"
import { User } from "../config/db"
import { authenticate, validate } from "../middlewares"
import { updateUserSchema, usersQuerySchema } from "../schemas/users"
import redis from "../services/redis"
import { res } from "../utils"

const users = new Hono()
  .use(authenticate)
  /**
   * Get users.
   */
  .get("/", validate("query", usersQuerySchema), async (c) => {
    const { q, filter, sort = {} } = c.req.valid("query")

    const query =
      q && filter
        ? {
            $or: filter.map((key) => ({ [key]: { $regex: q, $options: "i" } })),
          }
        : {}

    const users = await User.find(query, {
      projection: { password: 0, createdAt: 0, updatedAt: 0 },
      sort,
      limit: 10,
    }).toArray()

    return c.json(users)
  })

  /**
   * Get user by id.
   */
  .get("/:id", async (c) => {
    const userId = c.req.param("id")
    const cache = await redis.get(`user:${userId}`)
    if (cache) return c.json(JSON.parse(cache))
    const user = await User.findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0, createdAt: 0, updatedAt: 0 } }
    )
    if (!user) return c.json(res("User not found."), 404)
    await redis.set(`user:${userId}`, JSON.stringify(user))
    return c.json(user)
  })

  /**
   * Update user by id.
   */
  .put("/:id", validate("json", updateUserSchema), async (c) => {
    const auth = c.get("auth")
    const userId = c.req.param("id")
    if (auth.id !== userId && auth.role !== "admin") {
      return c.json(res("You can't update this user."), 403)
    }

    const { email, username, displayName } = c.req.valid("json")
    const exist = await User.findOne(
      { $or: [{ email }, { username: username }] },
      { collation: { locale: "en", strength: 2 } }
    )
    if (exist) return c.json(res("Email or username already used."), 409)

    const result = await User.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          email: email,
          username: username,
          displayName: displayName,
          updatedAt: new Date().toISOString(),
        },
      }
    )
    if (result.modifiedCount === 0) return c.json(res("User not found."), 404)
    await redis.del(`user:${userId}`)
    return c.json(res("User updated."))
  })

  /**
   * Delete user by id.
   */
  .delete("/:id", async (c) => {
    const auth = c.get("auth")
    const userId = c.req.param("id")
    if (auth.id !== userId && auth.role !== "admin") {
      return c.json(res("You can't delete this user."), 403)
    }

    const result = await User.deleteOne({ _id: new ObjectId(userId) })
    if (result.deletedCount === 0) return c.json(res("User not found."), 404)
    await redis.del(`user:${userId}`)
    return c.json(res("User deleted."))
  })

export default users
