import { cookieOptions } from "../../utils/cookieOptions.js"
import { loginService } from "./auth.service.js"

export async function login(req, res) {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ message: "username or password is required." })
  }
  
  const result = await loginService(username, password)
  
  res.cookie("accessToken", result.token, cookieOptions())
  res.json({
    message: "Login successfully."
  })
}

export async function logout(req, res) {
  res.clearCookie("accessToken")
  res.json({ message: "Logout successfully." })
}

export async function me(req, res) {
  res.json({ user: req.user })
}