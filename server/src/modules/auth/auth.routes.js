import { Router } from "express"
import { authRequired } from "../../middlewares/auth.js"
import {
  login,
  logout,
  me
} from "./auth.controller.js"

const router = Router()

router.use("/login", login)
router.use("/logout", logout)
router.use("/me", authRequired, me)

export default router