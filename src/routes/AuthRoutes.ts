import {Router} from "express"
import userController from "../controller/UserController"
import followController from "../controller/FollowController"
import AuthController from "../controller/AuthController";

const router = Router()

// Register
router.post("/register", AuthController.register)

// Login
router.post("/login", AuthController.login)

// Validate username
router.get("/validate/:username", AuthController.validateUsername)

export default router
