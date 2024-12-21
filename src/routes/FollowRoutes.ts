import { Router } from "express"
import multer from "../util/multer"
import userController from "../controller/UserController"
import followController from "../controller/FollowController"

const router = Router()

// Follow User
router.post("/:senderId/:receiverId", followController.follow)

export default router