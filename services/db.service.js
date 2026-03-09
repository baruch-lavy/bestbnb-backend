import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dns from "dns";
import { logger } from "./logger.service.js";

//  Load environment variables from .env
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const DB_NAME = process.env.DB_NAME;

export const dbService = { getCollection };

let dbConn = null;

async function getCollection(collectionName) {
  try {
    const db = await _connect();
    const collection = await db.collection(collectionName);
    if (collectionName === 'agents') {
      await collection.createIndex({ agentCode: 1 }, { unique: true });
    }
    return collection;
  } catch (err) {
    logger.error(` Failed to get collection: ${collectionName}`, err);
    throw err;
  }
}

async function _connect() {
  console.log("Connecting to MongoDB...", MONGO_URI, DB_NAME);
  try {
    const servers = dns.getServers();
    if (servers && servers.length && servers[0].startsWith("127.")) {
      dns.setServers(["1.1.1.1", "8.8.8.8"]);
      logger.info(
        "Overrode Node DNS servers to 1.1.1.1, 8.8.8.8 to allow SRV lookups",
      );
    }
  } catch (e) {
    logger.warn("Could not inspect/override DNS servers", e);
  }
  if (dbConn) return dbConn;

  try {
    if (!MONGO_URI) throw new Error(" MONGO_URI is missing in .env");
    let dbName = DB_NAME;
    if (!dbName) {
      const parts = MONGO_URI.split("/");
      // parts[3] is the path part after the host (e.g. "stayDB?appName=...")
      const path = parts[3] || "";
      dbName = path.split("?")[0] || null;
    }

    // Add sensible timeouts so failures surface quickly in dev
    const client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    await client.connect();
    dbConn = client.db(dbName);

    logger.info(` Connected to MongoDB: ${dbName}`);
    return dbConn;
  } catch (err) {
    // If SRV lookup fails, give a clearer hint for the user
    if (err && err.message && err.message.includes("querySrv")) {
      logger.error(
        " Cannot connect to MongoDB via SRV. DNS SRV lookup failed.\n" +
          "  - Check your network/DNS (port 53) or VPN/firewall settings.\n" +
          "  - Alternatively, use the non-SRV connection string Atlas provides (mongodb://...)\n" +
          "  - Ensure your .env MONGO_URI is correct and reachable",
        err,
      );
    } else {
      logger.error(" Cannot connect to MongoDB", err);
    }
    throw err;
  }
}
