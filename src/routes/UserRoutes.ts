import {Router} from "express"
import multer from "../util/multer"
import userController from "../controller/UserController"
import followController from "../controller/FollowController"
import authMiddleware from "../util/verifyToken";
import route from "../routes";

const router = Router()

// Change Password
router.put('/changePassword', userController.changePassword)

// Change Visibility
router.patch("/changeVisibility", userController.changeVisibility)

// Get followers list
router.get("/followersList", followController.followersList)

// Get following list
router.get("/followingList", followController.followingList)

// Follow-Unfollow User
router.post("/follow/:followedTo", followController.follow)

// Profile Image
router.post("/profileImage", multer.single('image'), userController.uploadProfileImage)

// Add User Details
router.put("/details", userController.updateUserDetails)

// All Users
router.get("/list", userController.getAllUsers)

// Get User
router.get("/", userController.getUserById)

// Delete User
router.delete("/", userController.deleteUser)

// Get user by id
router.get("/:userId", userController.getUserById)

// Search for users
router.get("search", userController.searchUsers)

export default router
