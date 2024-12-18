import { Router, Request, Response } from "express"
import { User } from "../model/User"
import { Multer } from "multer"
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from 'crypto'
import dotenv from 'dotenv'
import { Post } from "../model/Post"
import { Highlight } from "../model/Highlight"
import mongoose from "mongoose"

dotenv.config()

// Image Name Generator
const randomImageName = () => crypto.randomBytes(32).toString('hex')
const connection = mongoose.connection

const UserRoute = (client: S3Client, multer: Multer) => {

    const router = Router()

    // Profile Image
    router.post("/:id/profileImage", multer.single('image'), async (req: Request, res: Response) => {
        try {
            if (!req.file)
                res.status(400).json({ message: "Bad Request" })

            const id = parseInt(req.params.id)
            const user = await User.findOne({ id: id })

            if (!user) {
                res.status(404).json({ message: "User not found" })
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

            res.status(200).json({ message: "Profile picture updated" })
        } catch (error) {
            res.status(500).json({ error: "Failed to upload image", details: error })
        }
    })

    // Add User
    router.post("/", async (req: Request, res: Response) => {
        try {
            const body = req.body
            const count = await User.countDocuments({}, { hint: "_id_" })

            const user = new User({
                id: count + 1,
                username: body.username,
                postsCount: "0",
                followersCount: body.followersCount,
                followingCount: body.followingCount,
                fullName: body.fullName,
                bio: body.bio,
                highlights: [],
                posts: []
            })

            const savedUser = await user.save()
            res.status(201).json(savedUser)
        } catch (error) {
            res.status(500).json({ error: "Failed to create user", details: error })
        }
    })

    // All Users
    router.get("/", async (req: Request, res: Response) => {
        try {
            const users = await User.find()

            for (const user of users) {

                if (user?.profileImageUrl == "") {
                    continue
                }

                const getObjectParams = {
                    Bucket: process.env.BUCKET_NAME!!,
                    Key: user?.profileImageUrl
                }

                const command = new GetObjectCommand(getObjectParams)
                const url = await getSignedUrl(client, command, { expiresIn: 3600 })
                user!!.profileImageUrl = url

                const posts = await Post.find({ userId: user.id })

                for (const post of posts) {
                    const getObjectParams = {
                        Bucket: process.env.BUCKET_NAME!!,
                        Key: post.postUrl
                    }

                    const command = new GetObjectCommand(getObjectParams)
                    const url = await getSignedUrl(client, command, { expiresIn: 3600 })

                    post.postUrl = url
                }

                user!!.posts = posts

                // Get Highlights Signed Urls
                const highlights = await Highlight.find({ userId: user.id })

                for (const highlight of highlights) {
                    const getObjectParams = {
                        Bucket: process.env.BUCKET_NAME!!,
                        Key: highlight.highlightUrl
                    }

                    const command = new GetObjectCommand(getObjectParams)
                    const url = await getSignedUrl(client, command, { expiresIn: 3600 })

                    highlight.highlightUrl = url
                }

                user!!.highlights = highlights
            }

            res.status(200).json(users)
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch users', details: error })
        }
    })

    // Get User
    router.get("/:id", async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id)
            const user = await User.findOne({ id: id })

            if (user == null)
                res.status(404).json({ error: 'User not found' })

            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: user?.profileImageUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            const url = await getSignedUrl(client, command, { expiresIn: 3600 })
            user!!.profileImageUrl = url

            const posts = await Post.find({ userId: id })

            // Get Posts Signed Urls
            for (const post of posts) {
                const getObjectParams = {
                    Bucket: process.env.BUCKET_NAME!!,
                    Key: post.postUrl
                }

                const command = new GetObjectCommand(getObjectParams)
                const url = await getSignedUrl(client, command, { expiresIn: 3600 })

                post.postUrl = url
            }

            user!!.posts = posts

            // Get Highlights Signed Urls
            const highlights = await Highlight.find({ userId: id })

            for (const highlight of highlights) {
                const getObjectParams = {
                    Bucket: process.env.BUCKET_NAME!!,
                    Key: highlight.highlightUrl
                }

                const command = new GetObjectCommand(getObjectParams)
                const url = await getSignedUrl(client, command, { expiresIn: 3600 })

                highlight.highlightUrl = url
            }

            user!!.highlights = highlights

            res.status(200).json(user)
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch user', details: error })
        }
    })

    // Update Bio
    router.put("/:id", async (req: Request, res: Response) => {
        try {
            const id = req.params.id
            const bio = req.body.bio

            if (bio == null)
                res.status(400).json({ error: "Bad Request" })

            const user = await User.findOneAndUpdate({ id: parseInt(id) }, { bio: bio }, { new: true })

            if (user == null)
                res.status(404).json({ error: "User Not Found" })

            res.status(200).json({ message: "Bio updated" })
        } catch (error) {
            res.status(500).json({ error: 'Failed to update user', details: error })
        }
    })

    // Delete User
    router.delete("/:id", async (req: Request, res: Response) => {
        const session = await connection.startSession()

        try {
            session.startTransaction()

            const id = parseInt(req.params.id)
            const deletedUser = await User.findOneAndDelete({ id: id })

            if (!deletedUser)
                throw new Error('User not found')

            const deletedPosts = await Post.deleteMany({ userId: id })
            const deletedHighlights = await Highlight.deleteMany({ userId: id })

            if (!deletedPosts || !deletedHighlights)
                throw new Error("Unknown error occured")

            await session.commitTransaction()

            res.status(200).json({ message: 'User deleted successfully' })
        }
        catch (error) {
            await session.abortTransaction()
            res.status(500).json({ error: 'Failed to delete user', details: error })
        }
    })

    return router
}

export default UserRoute