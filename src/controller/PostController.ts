import {Request, Response} from "express"
import {User} from "../model/User"
import {Post} from '../model/Post'
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3"
import crypto from 'crypto'
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
import client from "../util/s3Client"
import {Comment} from "../model/Comment"
import {FollowEntry} from "../model/Followers"

// Image Name Generator
const randomImageName = () => crypto.randomBytes(32).toString('hex')
const bucketName = process.env.BUCKET_NAME || 'myBucketName'

const likeComment = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId)
        const commentId = parseInt(req.params.commentId)

        const comment = await Comment.findOne({id: commentId})

        if (!comment) {
            res.status(404).json({message: "Comment not found"})
            return
        }

        comment.likedBy = comment.likedBy ?? []

        let message: string

        // Remove Like
        if (comment.likedBy.includes(userId)) {
            comment.likedBy = comment.likedBy.filter(it => it != userId)
            message = "Unliked"
        }
        // Add Like
        else {
            comment.likedBy.push(userId)
            message = "Liked"
        }

        comment.likesCount = comment.likedBy.length.toString()
        await comment.save()
        res.status(200).json({message: message})

    } catch (error: any) {

    }
}

const comment = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId)
        const postId = parseInt(req.params.postId)

        const comment = req.body.comment

        if (!comment || comment == "") {
            res.status(400).json({message: "Bad Request"})
            return
        }

        const post = await Post.findOne({id: postId})

        if (!post) {
            res.status(404).json({message: "Post not found"})
            return
        }

        const count = await Comment.countDocuments({postId: postId})

        const commentModel = new Comment({
            id: count + 1,
            userId: userId,
            postId: postId,
            comment: comment
        })

        const savedComment = await commentModel.save()

        if (!savedComment) {
            throw new Error("Unknown error occured")
        } else {
            res.status(201).json({message: "Comment added"})
        }

    } catch (error: any) {
        res.status(500).json({error: 'Failed to add comment', details: error})
    }
}

const likePost = async (req: Request, res: Response) => {
    try {

        const userId = parseInt(req.params.userId)
        const postId = parseInt(req.params.postId)

        const post = await Post.findOne({id: postId})

        if (!post) {
            res.status(404).json({message: "Post not found"})
            return
        }

        post.likedBy = post.likedBy ?? []
        let message: string

        // Remove Like
        if (post.likedBy.includes(userId)) {
            post.likedBy = post.likedBy.filter(it => it != userId)
            message = "Unliked"
        }
        // Add Like
        else {
            post.likedBy.push(userId)
            message = "Liked"
        }

        post.likesCount = post.likedBy.length.toString()
        await post.save()
        res.status(200).json({message: message})

    } catch (error: any) {
        res.status(500).json({error: 'Failed to like post', details: error})
    }
}

const getFeed = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId)

        const followedAccounts: number[] = (await FollowEntry.findOne({
            userId: userId
        }).select('followingList'))?.followingList ?? []

        const users = await User.find({
            id: { $ne: userId },
            $or: [
                { private: false }, // Public accounts
                { private: true, id: { $in: followedAccounts } } // Private accounts followed by the user
            ]
        }).select('id')

        const listOfUsers: number[] = users.map(user => user.id)

        const posts = await Post.find({userId: {$in: listOfUsers}})

        for (const post of posts) {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: post?.postUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            const url = await getSignedUrl(client, command, {expiresIn: 3600})
            post.postUrl = url

            const comments = await Comment.find({postId: post.id})
            post.comments = comments
            post.commentsCount = post.comments.length.toString()
        }

        res.status(200).json(posts)

    } catch (error: any) {
        res.status(500).json({error: 'Failed to fetch posts', details: error})
    }
}

const createPost = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({message: "Bad Request"})
            return
        }
        const userId = parseInt(req.params.userId)
        const user = await User.findOne({id: userId})

        if (!user) {
            res.status(404).json({message: "User not found"})
            return
        }
        // Upload image to S3 Bucket
        const imageName = randomImageName()

        const params = {
            Bucket: bucketName,
            Key: imageName,
            Body: req.file?.buffer,
            ContentType: req.file?.mimetype
        }

        const command = new PutObjectCommand(params)
        await client.send(command)

        const count = await Post.countDocuments({}, {hint: "_id_"})

        const post = new Post({
            id: count + 1,
            userId: userId,
            caption: req.body.caption || "",
            postUrl: imageName
        })

        const createdPost = await post.save()

        if (!createdPost) {
            throw new Error("Unknown error occured")
        } else {
            res.status(201).json({message: "Post created successfully"})
        }

    } catch (error: any) {
        res.status(500).json({error: "Failed to create post", details: error})
    }
}

const deletePost = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId)
        const postId = parseInt(req.params.postId)

        const post = await Post.findOne({id: postId, userId: userId})

        if (!post) {
            res.status(404).send({message: "Post not found"})
            return
        }

        const params = {
            Bucket: bucketName,
            Key: post.postUrl
        }

        const command = new DeleteObjectCommand(params)
        await client.send(command)

        const deletedPost = await post.deleteOne()

        if (!deletedPost) {
            res.status(500).send({message: "Unkown error occured"})
        } else {
            res.status(200).send({message: "Post deleted"})
        }

    } catch (error: any) {
        res.status(500).json({error: 'Failed to delete post', details: error})
    }
}

const getPostById = async (req: Request, res: Response) => {
    try {
        const postId = parseInt(req.params.postId)
        const post = await Post.findOne({id: postId})

        if (!post) {
            res.status(404).json({error: 'Post not found'})
        } else {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: post?.postUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            const url = await getSignedUrl(client, command, {expiresIn: 3600})
            post.postUrl = url

            const comments = await Comment.find({postId: post.id})
            post.comments = comments
            post.commentsCount = post.comments.length.toString()

            res.status(200).json(post)
        }
    } catch (error: any) {
        res.status(500).json({error: 'Failed to fetch post', details: error})
    }
}

const getAllPosts = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId)
        const posts = await Post.find({userId: userId})

        for (const post of posts) {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: post?.postUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            const url = await getSignedUrl(client, command, {expiresIn: 3600})
            post.postUrl = url

            const comments = await Comment.find({postId: post.id})
            post.comments = comments
            post.commentsCount = post.comments.length.toString()
        }

        res.status(200).json(posts)

    } catch (error: any) {
        res.status(500).json({error: 'Failed to fetch posts', details: error})
    }
}

const updateCaption = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId)
        const postId = parseInt(req.params.postId)
        const caption = req.body.caption

        if (!caption) {
            res.status(400).json({error: "Bad Request"})
            return
        }
        const post = await Post.findOneAndUpdate({id: postId, userId: userId}, {caption: caption}, {new: true})

        if (!post) {
            res.status(404).json({error: "Post Not Found"})
        } else {
            res.status(200).json({message: "Caption updated"})
        }
    } catch (error: any) {
        res.status(500).json({error: 'Failed to update caption', details: error})
    }
}

export default {
    getFeed,
    createPost,
    deletePost,
    getPostById,
    getAllPosts,
    updateCaption,
    likePost,
    comment,
    likeComment
}
