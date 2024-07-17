import { MongoClient } from "mongodb"
import { MONGODB_URI } from "../src/config/env"
import logger from "../src/services/logger"

const client = new MongoClient(MONGODB_URI)

const db = client.db()
const User = db.collection("users")
const Invitation = db.collection("invitations")

async function setIndexes() {
  try {
    logger.info("Connecting to database")
    await client.connect()

    await User.dropIndexes()
    await User.createIndex({ username: 1 }, { unique: true })
    await User.createIndex({ email: 1 }, { unique: true })
    logger.info("User collection indexes created:", await User.indexes())

    await Invitation.dropIndexes()
    await Invitation.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 3 })
    logger.info("Invitation collection indexes created:", await Invitation.indexes())
  } catch (error) {
    logger.error(error)
  } finally {
    await client.close()
    logger.info("Database connection closed")
  }
}

await setIndexes()
