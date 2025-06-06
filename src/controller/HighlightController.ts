import {Request, Response} from "express"
import {User} from "../model/User"
import {Highlight} from '../model/Highlight'
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3"
import crypto from 'crypto'
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
import client from "../util/s3Client"

const randomImageName = () => crypto.randomBytes(32).toString('hex')
const bucketName = process.env.BUCKET_NAME || 'myBucketName'

const createHighlight = async (req: Request, res: Response) => {
    try {
        if (!req.body || !req.file) {
            res.status(400).json({ message: "Bad Request" })
            return
        }

        // Upload image to S3 Bucket & Data to MongoDB
        const userId = req.userId
        const user = await User.findOne({ id: userId })
        const title = req.body.title

        if (!user) {
            res.status(404).json({ message: "User not found" })
            return
        }

        const imageName = randomImageName()
        const params = {
            Bucket: bucketName,
            Key: imageName,
            Body: req.file?.buffer,
            ContentType: req.file?.mimetype
        }
        const command = new PutObjectCommand(params)

        await client.send(command)

        const count = await Highlight.countDocuments({ userId: userId })

        const highlight = new Highlight({
            id: count + 1,
            userId: userId,
            highlightUrl: imageName,
            title: title
        })

        await highlight.save()

        res.status(200).json({ message: "Highlight created successfully" })
    } catch (error: any) {
        res.status(500).json({ error: "Failed to upload image", details: error })
    }
}

const deleteHighlight = async (req: Request, res: Response) => {
    try {
        const highlightId = parseInt(req.params.highlightId)
        const userId = req.userId

        const highlight = await Highlight.findOne({ id: highlightId, userId: userId })

        if (!highlight) {
            res.status(404).send({ message: "Highlight not found" })
        }

        const params = {
            Bucket: bucketName,
            Key: highlight?.highlightUrl
        }

        const command = new DeleteObjectCommand(params)
        await client.send(command)

        const deleteHighlight = await highlight?.deleteOne()

        if (!deleteHighlight) {
            res.status(500).send({ message: "Unknown error occurred" })
        } else {
            res.status(200).send({ message: "Highlight deleted" })
        }
    } catch (error: any) {

    }
}

const getHighlight = async (req: Request, res: Response) => {
    try {
        const highlightId = parseInt(req.params.highlightId)
        const userId = req.userId
        const highlight = await Highlight.findOne({ id: highlightId, userId: userId })

        if (!highlight) {
            res.status(404).json({ error: 'Highlight not found' })
        } else {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: highlight?.highlightUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            const url = await getSignedUrl(client, command, { expiresIn: 3600 })
            highlight!!.highlightUrl = url

            res.status(200).json(highlight)
        }
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch highlight', details: error })
    }
}

const allHighlights = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const highlights = await Highlight.find({ userId: userId })

        for (const highlight of highlights) {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: highlight.highlightUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            highlight!!.highlightUrl = await getSignedUrl(client, command, {expiresIn: 3600})
        }

        res.status(200).json(highlights)

    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch highlights', details: error })
    }
}

export default {
    createHighlight,
    deleteHighlight,
    getHighlight,
    allHighlights
}
