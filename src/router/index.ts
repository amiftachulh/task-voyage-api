import { Hono } from "hono"
import auth from "./auth"
import boards from "./boards"
import cards from "./cards"
import lists from "./lists"
import users from "./users"

const router = new Hono()
  .basePath("/v1")
  .route("/auth", auth)
  .route("/users", users)
  .route("/boards", boards)
  .route("/lists", lists)
  .route("/cards", cards)

export default router
