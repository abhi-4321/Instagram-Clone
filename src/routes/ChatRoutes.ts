import {Router} from "express";
import ChatController from "../controller/ChatController";

const router = Router()

// Chat users
router.get("/users", ChatController.getChatUsers)

// Get all users
router.get("/all",ChatController.getFollowers)

// Send message
router.get("/:receiverId", ChatController.getChat)

export default router