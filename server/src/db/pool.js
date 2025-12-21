import pg from "pg"
import { env } from "../config/env.js"

const { Pool } = pg

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : undefined
})

pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err)
  }
  
  console.log("Successfully connected to database!")
  release()
})