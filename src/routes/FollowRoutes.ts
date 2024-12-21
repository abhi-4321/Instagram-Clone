import { Router } from "express"
import followController from "../controller/FollowController"

const router = Router()

// Follow-Unfollow User
router.post("/:followedBy/follow/:followedTo", followController.follow)

export default router