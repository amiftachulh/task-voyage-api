import { Hono } from "hono"
import { deleteCookie, setCookie } from "hono/cookie"
import { sign } from "hono/jwt"
import { hash, verify } from "@node-rs/argon2"
import { ObjectId } from "mongodb"
import { v7 as uuidv7 } from "uuid"
import { User } from "../config/db"
import { JWT_SECRET } from "../config/env"
import { authenticate, validate } from "../middlewares"
import { JwtPayloadSchema, loginSchema, registerSchema } from "../schemas/auth"
import redis from "../services/redis"
import { res } from "../utils"

const auth = new Hono()
  /**
   * Register a user.
   */
  .post("/register", validate("json", registerSchema), async (c) => {
    const body = c.req.valid("json")
    const exist = await User.findOne(
      { email: body.email },
      { collation: { locale: "en", strength: 2 } }
    )

    if (exist) return c.json(res("Email or username already used."), 409)
    const hashedPassword = await hash(body.password, {
      memoryCost: 19456,
      timeCost: 2,
      algorithm: 2,
    })

    const now = new Date().toISOString()
    await User.insertOne({
      email: body.email,
      username: null,
      displayName: null,
      password: hashedPassword,
      role: "user",
      createdAt: now,
      updatedAt: now,
    })

    return c.json(res("Register success."), 201)
  })

  /**
   * Login a user.
   */
  .post("/login", validate("json", loginSchema), async (c) => {
    const { emailOrUsername, password } = c.req.valid("json")

    const user = await User.findOne(
      { $or: [{ email: emailOrUsername }, { username: emailOrUsername }] },
      { collation: { locale: "en", strength: 2 } }
    )
    if (!user) return c.json(res("Invalid email or username or password"), 401)

    const match = await verify(user.password, password)
    if (!match) return c.json(res("Invalid email or username or password"), 401)

    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
    const payload: JwtPayloadSchema = {
      id: user._id.toString(),
      exp,
      jti: uuidv7(),
      role: user.role,
    }
    const token = await sign(payload, JWT_SECRET)

    setCookie(c, "token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      expires: new Date(exp * 1000),
    })

    const { password: _, ...userInfo } = user
    return c.json(userInfo)
  })

  /**
   * Get authenticated user.
   */
  .get("/me", authenticate, async (c) => {
    const user = await User.findOne({ _id: new ObjectId(c.get("auth").id) })
    if (!user) return c.json(res("User not found."), 401)
    const { password: _, ...userInfo } = user
    return c.json(userInfo)
  })
  /**
   * Logout a user.
   */
  .post("/logout", authenticate, async (c) => {
    const auth = c.get("auth")
    await redis.set(`revoked:${auth.jti}`, 1, "EXAT", auth.exp)
    deleteCookie(c, "token")
    return c.json(res("Logout success."))
  })

export default auth
