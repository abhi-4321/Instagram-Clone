import {Router} from "express"
import multer from "../util/multer"
import userController from "../controller/UserController"
import followController from "../controller/FollowController"
import authMiddleware from "../util/verifyToken";

const router = Router()

// Change Visibility
router.patch("/:userId/changeVisibility", authMiddleware, userController.changeVisibility)

// Follow-Unfollow User
router.post("/:followedBy/follow/:followedTo", authMiddleware,followController.follow)

// Profile Image
router.post("/:userId/profileImage", multer.single('image'), authMiddleware, userController.uploadProfileImage)

// Add User Details
router.post("/details/:userId", authMiddleware, userController.addUserDetails)

// All Users
router.get("/", authMiddleware, userController.getAllUsers)

// Get User
router.get("/:userId", authMiddleware, userController.getUserById)

// Update Bio
router.put("/:userId", authMiddleware, userController.updateBio)

// Delete User
router.delete("/:userId", authMiddleware, userController.deleteUser)

export default router
