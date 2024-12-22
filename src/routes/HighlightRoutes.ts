import { Router } from "express"
import highlightController from '../controller/HighlightController'
import multer from "../util/multer"

const router = Router()

// Create Highlight
router.post("/:userId", multer.single('image'), highlightController.createHighlight)

// Delete Highlight
router.delete('/:userId/:highlightId', highlightController.deleteHighlight)

// Get Highlight
router.get("/:userId/:highlightId", highlightController.getHighlight)

// All Highlights
router.get("/:userId", highlightController.allHighlights)

export default router