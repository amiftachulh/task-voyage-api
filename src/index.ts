import { Hono } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { serve } from "@hono/node-server"
import { connectDb } from "./config/db"
import { ALLOWED_ORIGINS, PORT } from "./config/env"
import router from "./router"
import logger from "./services/logger"
import { res } from "./utils"

connectDb()

const app = new Hono()

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
)

app.route("/", router)

app.onError((err, c) => {
  logger.error(err)
  if (err instanceof HTTPException) {
    return c.json(res(err.message), err.status)
  }
  return c.text("Internal Server Error", 500)
})

serve(
  {
    fetch: app.fetch,
    port: PORT || 3000,
  },
  (info) => logger.info(`Server is running on http://${info.address}:${info.port}`)
)
