import { env } from "./config/env.js"

import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

import { notFound } from "./middlewares/notFound.js"
import { errorHandler } from "./middlewares/error.js"
import routes from "./routes/index.js"

const app = express()

app.use(cors({
  origin: true,
  credintials: true
}))
app.use(express.json({
  limit: "10mb"
}))
app.use(cookieParser())

app.use("/api", routes)

app.use(notFound)
app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`POS API running on port ${env.PORT}`)
})

export default app