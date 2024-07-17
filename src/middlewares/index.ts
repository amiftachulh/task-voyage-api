import { ValidationTargets } from "hono"
import { getCookie } from "hono/cookie"
import { createMiddleware } from "hono/factory"
import { verify } from "hono/jwt"
import { validator } from "hono/validator"
import { z } from "zod"
import { JWT_SECRET } from "../config/env"
import { JwtPayloadSchema, jwtPayloadSchema } from "../schemas/auth"
import redis from "../services/redis"
import { res } from "../utils"

export function validate<Target extends keyof ValidationTargets, T extends z.ZodSchema>(
  target: Target,
  schema: T
) {
  return validator(target, (value, c) => {
    const result = schema.safeParse(value)
    if (!result.success) {
      let t: string
      switch (target) {
        case "json":
          t = "request body"
          break
        case "query":
          t = "query string"
          break
        case "param":
          t = "URL parameters"
          break
        default:
          t = "input"
      }
      return c.json(res(`Invalid ${t}.`, result.error.flatten().fieldErrors), 400)
    }
    return result.data as z.infer<T>
  })
}

export const authenticate = createMiddleware<{ Variables: { auth: JwtPayloadSchema } }>(
  async (c, next) => {
    const token = getCookie(c, "token")
    if (!token) {
      return c.json(res("Invalid session."), 401)
    }

    let decoded
    try {
      decoded = await verify(token, JWT_SECRET)
    } catch (error) {
      return c.json(res("Session expired."), 401)
    }

    const parsed = jwtPayloadSchema.safeParse(decoded)
    if (!parsed.success) {
      return c.json(res("Invalid session."), 401)
    }

    const isRevoked = await redis.get(`revoked:${parsed.data.jti}`)
    if (isRevoked) {
      return c.json(res("Session expired."), 401)
    }

    c.set("auth", parsed.data)

    await next()
  }
)
