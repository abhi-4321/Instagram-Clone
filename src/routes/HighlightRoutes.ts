import { Router } from "express"
import highlightController from '../controller/HighlightController'
import multer from "../util/multer"

const router = Router()

// Create Highlight
router.post("/:id", multer.single('image'), highlightController.createHighlight)

// Delete Highlight
router.delete('/:uid/:hid', highlightController.deleteHighlight)

// Get Highlight
router.get("/:uid/:hid", highlightController.getHighlight)

// All Highlights
router.get("/:uid", highlightController.allHighlights)

export default router