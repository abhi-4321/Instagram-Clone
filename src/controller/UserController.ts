import {Request, Response} from "express"
import {User} from "../model/User"
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3"
import crypto from 'crypto'
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
import client from "../util/s3Client"
import {Post} from "../model/Post"
import {Highlight} from "../model/Highlight"
import {connection} from "mongoose"
import {Comment} from "../model/Comment"
import {FollowEntry} from "../model/Followers"
import bcrypt from "bcrypt";

// Image Name Generator
const randomImageName = () => crypto.randomBytes(32).toString('hex')
const bucketName = process.env.BUCKET_NAME || 'myBucketName'

const changePassword = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const password = req.body.password
        const user = await User.findOne({id: userId})

        if (!user) {
            res.status(404).json({message: "User not found"})
            return
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        await User.findOneAndUpdate({id: userId}, {password: hashedPassword}, {new: true})

        res.status(201).json({ message: "Password changed successfully." })
    } catch (e: any) {
        res.status(500).json({error: "Failed to change password", details: e})
    }
}

const changeVisibility = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const user = await User.findOne({id: userId})

        if (!user) {
            res.status(404).json({message: "User not found"})
            return
        }

        let message = ""

        if (user.private) {
            user.private = false
            message = "Account set to public"
        } else {
            user.private = true
            message = "Account set to private"
        }
        await user.save()

        res.status(200).json({message: message})
    } catch (error: any) {
        res.status(500).json({error: "Failed to change visibility", details: error})
    }
}

const uploadProfileImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({message: "Bad Request"})
            return
        }
        const userId = req.userId
        const user = await User.findOne({id: userId})

        if (!user) {
            res.status(404).json({message: "User not found"})
            return
        }

        // Upload image to S3 Bucket

        const imageName = randomImageName()

        const params = {
            Bucket: process.env.BUCKET_NAME!!,
            Key: imageName,
            Body: req.file!!.buffer,
            ContentType: req.file!!.mimetype
        }

        const command = new PutObjectCommand(params)
        await client.send(command)

        // Update image name in database

        user!!.profileImageUrl = imageName
        const updatedUser = await user?.save()

        if (!updatedUser)
            throw new Error('Unable to update the profile image')

        res.status(200).json({message: "Profile picture updated"})
    } catch (error: any) {
        res.status(500).json({error: "Failed to upload image", details: error})
    }
}

const addUserDetails = async (req: Request, res: Response) => {
    try {
        // Proceed with user creation
        const userId = req.userId
        const body = req.body
        const exists = await User.findOne({id: userId})

        if (exists) {
            res.status(400).json({error: "Username already exists"})
            return
        }

        const savedUser = await User.findOneAndUpdate({id: userId}, {
            fullName: body.fullName,
            bio: body.bio
        }, {new: true})

        // Respond with the newly created user
        res.status(201).json(savedUser)
    } catch (error: any) {
        res.status(500).json({error: "Failed to create user", details: error.message})
    }
}

const getAllUsers = async (_req: Request, res: Response) => {
    try {
        const users = await User.find()

        for (const user of users) {

            const posts = await Post.find({userId: user.id})

            for (const post of posts) {
                const getObjectParams = {
                    Bucket: process.env.BUCKET_NAME!!,
                    Key: post.postUrl
                }

                const command = new GetObjectCommand(getObjectParams)
                const url = await getSignedUrl(client, command, {expiresIn: 3600})

                post.postUrl = url

                const comments = await Comment.find({postId: post.id})
                post.comments = comments
                post.commentsCount = post.comments.length.toString()
            }

            user.posts = posts
            user.postsCount = posts.length.toString()

            // Get Highlights Signed Urls
            const highlights = await Highlight.find({userId: user.id})

            for (const highlight of highlights) {
                const getObjectParams = {
                    Bucket: process.env.BUCKET_NAME!!,
                    Key: highlight.highlightUrl
                }

                const command = new GetObjectCommand(getObjectParams)
                const url = await getSignedUrl(client, command, {expiresIn: 3600})

                highlight.highlightUrl = url
            }

            user.highlights = highlights

            if (user?.profileImageUrl == "") {
                continue
            }

            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: user?.profileImageUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            const url = await getSignedUrl(client, command, {expiresIn: 3600})
            user.profileImageUrl = url

            const entry = await FollowEntry.findOne({userId: user.id})

            user.followersCount = entry!!.followersList.length.toString()
            user.followingCount = entry!!.followingList.length.toString()
        }

        res.status(200).json(users)

    } catch (error: any) {
        res.status(500).json({error: 'Failed to fetch users', details: error})
    }
}

const getUserById = async (req: Request, res: Response) => {

    try {
        const userId = req.userId
        const user = await User.findOne({id: userId})

        if (!user) {
            res.status(404).json({error: 'User not found'})
            return
        }

        if (user.profileImageUrl != "") {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: user?.profileImageUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            const url = await getSignedUrl(client, command, {expiresIn: 3600})
            user.profileImageUrl = url
        }

        const posts = await Post.find({userId: userId})

        // Get Posts' Signed Urls
        for (const post of posts) {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: post.postUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            const url = await getSignedUrl(client, command, {expiresIn: 3600})

            post.postUrl = url

            const comments = await Comment.find({postId: post.id})
            post.comments = comments
            post.commentsCount = post.comments.length.toString()
        }

        user.posts = posts
        user.postsCount = posts.length.toString()

        // Get Highlights Signed Urls
        const highlights = await Highlight.find({userId: userId})

        for (const highlight of highlights) {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: highlight.highlightUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            const url = await getSignedUrl(client, command, {expiresIn: 3600})

            highlight.highlightUrl = url
        }

        user.highlights = highlights

        const entry = await FollowEntry.findOne({userId: userId})

        user.followersCount = entry!!.followersList.length.toString()
        user.followingCount = entry!!.followingList.length.toString()

        res.status(200).json(user)
    } catch (error: any) {
        res.status(500).json({error: 'Failed to fetch user', details: error})
    }
}

const deleteUser = async (req: Request, res: Response) => {
    const session = await connection.startSession()

    try {
        session.startTransaction()

        const userId = req.userId
        const user = await User.findOne({id: userId})

        if (!user) {
            res.status(404).json({error: 'User not found'})
            return
        }

        const profileParams = {
            Bucket: bucketName,
            Key: user.profileImageUrl
        }

        const command = new DeleteObjectCommand(profileParams)

        await client.send(command)
        await user.deleteOne()

        const posts = await Post.find({userId: userId})
        const highlights = await Highlight.find({userId: userId})

        for (const post of posts) {
            const params = {
                Bucket: bucketName,
                Key: post.postUrl
            }
            const command = new DeleteObjectCommand(params)

            await client.send(command)
        }

        for (const highlight of highlights) {
            const params = {
                Bucket: bucketName,
                Key: highlight.highlightUrl
            }
            const command = new DeleteObjectCommand(params)

            await client.send(command)
        }

        const deletedPosts = await Post.deleteMany({userId: userId})
        const deletedHighlights = await Highlight.deleteMany({userId: userId})

        if (!deletedPosts || !deletedHighlights) {
            res.status(500).json({error: 'Failed to delete user'})
            return
        }

        await session.commitTransaction()

        res.status(200).json({message: 'User deleted successfully'})
    } catch (error: any) {
        await session.abortTransaction()
        res.status(500).json({error: 'Failed to delete user', details: error})
    }
}

export default {
    uploadProfileImage,
    addUserDetails,
    getAllUsers,
    getUserById,
    deleteUser,
    changeVisibility,
    changePassword
}
