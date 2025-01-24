import {Router} from "express"
import multer from "../util/multer"
import userController from "../controller/UserController"
import followController from "../controller/FollowController"
import AuthController from "../controller/AuthController";

const router = Router()

// Register
router.post("/register", AuthController.register)

// Login
router.post("/login", AuthController.login)

export default router
