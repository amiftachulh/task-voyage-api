import { hash } from "@node-rs/argon2"
import { MongoClient } from "mongodb"
import { ADMIN_PASSWORD, ADMIN_USERNAME, MONGODB_URI } from "../src/config/env"
import logger from "../src/services/logger"

const client = new MongoClient(MONGODB_URI)

async function seed() {
  try {
    logger.info("Connecting to database")
    await client.connect()
    const user = await client.db().collection("users").findOne({ username: ADMIN_USERNAME })
    if (!user) {
      const now = new Date().toISOString()
      await client
        .db()
        .collection("users")
        .insertOne({
          username: ADMIN_USERNAME,
          displayName: "Admin",
          password: await hash(ADMIN_PASSWORD, {
            memoryCost: 19456,
            timeCost: 2,
            algorithm: 2,
          }),
          roles: ["admin"],
          createdAt: now,
          updatedAt: now,
        })
      logger.info("Admin user created successfully")
    } else {
      logger.info("Admin user already exists")
    }
    await client.close()
    logger.info("Database connection closed")
  } catch (error) {
    logger.error(error)
  }
}

seed()
