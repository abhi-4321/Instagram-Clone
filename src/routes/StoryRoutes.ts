import {Router} from "express";
import storyController from "../controller/StoryController";
import multer from "../util/multer";

const router = Router()

// Like Story
router.post("/like/:storyId", storyController.likeStory)

// Create Story
router.post("/", multer.single('image'), storyController.createStory)

// Delete Story
router.delete("/:storyId", storyController.deleteStory)

// Get Story by id
router.get("/:userId", storyController.getStoriesByUser)

// Get all stories
router.get("/", storyController.getAllStories)

export default router
