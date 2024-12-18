import { Router } from "express"
import multer from "../util/multer"
import userController from "../controller/UserController"

const router = Router()

// Profile Image
router.post("/:id/profileImage", multer.single('image'), userController.uploadProfileImage)

// Add User
router.post("/", userController.addUser)

// All Users
router.get("/", userController.getAllUsers)

// Get User
router.get("/:id", userController.getUserById)

// Update Bio
router.put("/:id", userController.updateBio)

// Delete User
router.delete("/:id", userController.deleteUser)

export default router