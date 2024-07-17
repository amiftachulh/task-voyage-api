import { z } from "zod"
import logger from "../services/logger"
import "dotenv/config"

const envVariables = z.object({
  PORT: z.coerce.number().optional(),
  MONGODB_URI: z.string(),
  ALLOWED_ORIGINS: z.string().transform((val) => val.split(",").map((origin) => origin.trim())),
  JWT_SECRET: z.string(),
  ADMIN_USERNAME: z.string(),
  ADMIN_PASSWORD: z.string(),
  REDIS_URL: z.string(),
})

let envOutput

try {
  envOutput = envVariables.parse(process.env)
  logger.info("Environment variables validation successful")
} catch (error) {
  if (error instanceof z.ZodError) {
    logger.error(`Environment variable validation failed: ${error.message}`)
  }
  process.exit(1)
}

export const {
  PORT,
  MONGODB_URI,
  ALLOWED_ORIGINS,
  JWT_SECRET,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  REDIS_URL,
} = envOutput
