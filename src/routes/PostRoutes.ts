import { Router } from "express"
import multer from "../util/multer"
import postController from '../controller/PostController'

const router = Router()

// Like Comment
router.post("/likeComment/:commentId", postController.likeComment)

// Comment
router.post("/comment/:postId", postController.comment)

// Like Post
router.post("/like/:postId", postController.likePost)

// Feed
router.get("/", postController.getFeed)

// Explore
router.get("/explore", postController.exploreSection)

// Create Post
router.post("/", multer.single('image'), postController.createPost)

// Delete Post
router.delete('/:postId', postController.deletePost)

// Get Post
router.get("/:postId", postController.getPostById)

// All Posts
router.get("/all", postController.getAllPosts)

// Update Caption
router.put("/:postId", postController.updateCaption)

// Save Post
router.post("/save/:postId", postController.savePost)

// Fetch Saved Posts
router.get("/saved", postController.fetchSaved)

// Remove saved post
router.delete("/saved/:postId", postController.unSavePost)

export default router
