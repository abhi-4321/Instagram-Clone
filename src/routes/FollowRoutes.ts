import { Router } from "express"
import followController from "../controller/FollowController"

const router = Router()

// Follow User
router.post("/:followedBy/follow/:followedTo", followController.follow)

// Unfollow User
router.post("/:unfollowedBy/unfollow/:unfollowedTo", followController.unfollow)

export default router