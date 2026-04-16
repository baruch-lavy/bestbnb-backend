import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import { logger } from './logger.service.js'

// ✅ Load environment variables from .env
dotenv.config()

const MONGO_URI = process.env.MONGO_URI
const DB_NAME = process.env.DB_NAME || 'stayDB'

export const dbService = { getCollection }

let dbConn = null

async function getCollection(collectionName) {
    try {
        const db = await _connect()
        const collection = await db.collection(collectionName)
        return collection
    } catch (err) {
        logger.error(`❌ Failed to get collection: ${collectionName}`, err)
        throw err
    }
}

async function _connect() {
    console.log('🚀 Connecting to MongoDB...', MONGO_URI , DB_NAME)
    if (dbConn) return dbConn

    try {
        if (!MONGO_URI) throw new Error('❌ MONGO_URI is missing in .env')
        
        const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        await client.connect()
        dbConn = client.db(DB_NAME)
        
        logger.info(`✅ Connected to MongoDB: ${DB_NAME}`)
        return dbConn
    } catch (err) {
        logger.error('❌ Cannot connect to MongoDB', err)
        throw err
    }
}
