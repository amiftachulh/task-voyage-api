import { MongoClient } from "mongodb"
import logger from "../services/logger"
import {
  BoardCollection,
  CardCollection,
  InvitationCollection,
  ListCollection,
  UserCollection,
} from "../types/doc"
import { MONGODB_URI } from "./env"

export const mongo = new MongoClient(MONGODB_URI)

export async function connectDb() {
  try {
    logger.info("Connecting to the database")
    await mongo.connect()
    await mongo.db().command({ ping: 1 })
    logger.info("Connected to the database")
  } catch (error) {
    logger.error(`Error connecting to the database: ${error}`)
  }
}

const db = mongo.db()

// Database collections
export const User = db.collection<UserCollection>("users")
export const Board = db.collection<BoardCollection>("boards")
export const Invitation = db.collection<InvitationCollection>("invitations")
export const List = db.collection<ListCollection>("lists")
export const Card = db.collection<CardCollection>("cards")
