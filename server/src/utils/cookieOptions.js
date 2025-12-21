import { env } from "../config/env.js"

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}