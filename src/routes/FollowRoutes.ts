import {Router} from "express"
import multer from "../util/multer"
import userController from "../controller/UserController"
import followController from "../controller/FollowController"

const router = Router()

// Followers List
router.get("/:userId/followersList", followController.followersList)

// Followers List
router.get("/:userId/followingList", followController.followingList)

export default router
