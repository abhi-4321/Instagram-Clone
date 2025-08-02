import { Router } from "express"
import highlightController from '../controller/HighlightController'
import multer from "../util/multer"

const router = Router()

// Create Highlight
router.post("/:highlightId", highlightController.createHighlight)

// Delete Highlight
router.delete('/:highlightId', highlightController.deleteHighlight)

// Get Highlight
router.get("/:highlightId", highlightController.getHighlight)

// All Highlights
router.get("/", highlightController.allHighlights)

// Fetch past stories
router.get("/stories", highlightController.allHighlights)

export default router
