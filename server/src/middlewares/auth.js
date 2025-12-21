import jwt from "jsonwebtoken"
import { env } from "../config/env.js"

export function authRequired(req, res, next) {
  const token = req.cookies?.accessToken
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  
  try {
    req.user = jwt.verify(token, env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: "Invalid token" })
  }
}