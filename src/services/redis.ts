import Redis from "ioredis"
import { REDIS_URL } from "../config/env"

const redis = new Redis(REDIS_URL)

export default redis
