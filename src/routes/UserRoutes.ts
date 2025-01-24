import {Router} from "express"
import multer from "../util/multer"
import userController from "../controller/UserController"
import followController from "../controller/FollowController"
import authMiddleware from "../util/verifyToken";

const router = Router()

// Change Visibility
router.patch("/:userId/changeVisibility", userController.changeVisibility)

// Follow-Unfollow User
router.post("/:followedBy/follow/:followedTo", followController.follow)

// Profile Image
router.post("/:userId/profileImage", multer.single('image'), userController.uploadProfileImage)

// Add User Details
router.post("/details/:userId", userController.addUserDetails)

// All Users
router.get("/", userController.getAllUsers)

// Get User
router.get("/:userId", userController.getUserById)

// Update Bio
router.put("/:userId", userController.updateBio)

// Delete User
router.delete("/:userId", userController.deleteUser)

export default router
