import {Router} from "express";
import storyController from "../controller/StoryController";

const router = Router()

// Like Story
router.post("/like/:storyId", storyController.likeStory)

// Create Story
router.post("/", storyController.createStory)

// Delete Story
router.delete("/:storyId", storyController.deleteStory)

// Get Story by id
router.get("/:storyId", storyController.getStoryById)

// Get all stories
router.get("/", storyController.getAllStories)

export default router
