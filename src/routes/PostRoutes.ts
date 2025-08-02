import { Router } from "express"
import multer from "../util/multer"
import postController from '../controller/PostController'

const router = Router()
// All Posts
router.get("/all", postController.getAllPosts)

// Feed
router.get("/", postController.getFeed)

// Explore
router.get("/explore", postController.exploreSection)

// Create Post
router.post("/", multer.single('image'), postController.createPost)

// Fetch Saved Posts
router.get("/saved", postController.fetchSaved)

// Save Post
router.post("/save/:postId", postController.savePost)

// Remove saved post
router.delete("/saved/:postId", postController.unSavePost)

// Like Comment
router.post("/likeComment/:commentId", postController.likeComment)

// Comment
router.post("/comment/:postId", postController.comment)

// Like Post
router.post("/like/:postId", postController.likePost)

// Delete Post
router.delete('/:postId', postController.deletePost)

// Get Post
router.get("/:postId", postController.getPostById)

// Update Caption
router.put("/:postId", postController.updateCaption)



export default router
