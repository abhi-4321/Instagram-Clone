import { Router, Request, Response } from "express"
import { User } from "../model/User"
import { Highlight } from "../model/Highlight"
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import crypto from 'crypto'
import { Multer } from "multer"
import dotenv from 'dotenv'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

dotenv.config()

// Image Name Generator
const randomImageName = () => crypto.randomBytes(32).toString('hex')

const bucketName = process.env.BUCKET_NAME || 'myBucketName'

const highlightRoute = (client: S3Client, multer: Multer) => {

    const router = Router()

    // Create Highlight
    router.post("/:id", multer.single('image'), async (req: Request, res: Response) => {
        try {
            if (!req.body || !req.file)
                res.status(400).json({ message: "Bad Request" })

            // Upload image to S3 Bucket & Data to MongoDB
            const id = parseInt(req.params.id)
            const user = await User.findOne({ id: id })
            const title = req.body.title

            if (!user)
                res.status(404).json({ message: "User not found" })

            const imageName = randomImageName()
            const params = {
                Bucket: bucketName,
                Key: imageName,
                Body: req.file?.buffer,
                ContentType: req.file?.mimetype
            }
            const command = new PutObjectCommand(params)

            await client.send(command)

            const count =  await Highlight.countDocuments({ userId: id })

            const highlight = new Highlight({
                id: count + 1,
                userId: id,
                highlightUrl: imageName,
                title: title
            })

            await highlight.save()

            res.status(200).json({ message: "Highlight created successfully" })
        } catch (error) {
            res.status(500).json({ error: "Failed to upload image", details: error })
        }
    })

    // Delete Highlight
    router.delete('/:uid/:hid', async (req: Request, res: Response) => {
        const hid = parseInt(req.params.hid)
        const uid = parseInt(req.params.uid)

        const highlight = await Highlight.findOneAndDelete({ id: hid, userId: uid  })

        if (!highlight)
            res.status(404).send({ message: "Highlight not found" })

        res.status(200).send({ message: "Highlight deleted" })
    })

    // Get Highlight
    router.get("/:uid/:hid", async (req: Request, res: Response) => {
        try {
            const hid = parseInt(req.params.hid)
            const uid = parseInt(req.params.uid)
            const highlight = await Highlight.findOne({ id: hid, userId: uid })

            if (highlight == null)
                res.status(404).json({ error: 'Highlight not found' })

            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: highlight?.highlightUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            const url = await getSignedUrl(client, command, { expiresIn: 3600 })
            highlight!!.highlightUrl = url

            res.status(200).json(highlight)
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch highlight', details: error })
        }
    })

    // All Highlights
    router.get("/:uid", async (req: Request, res: Response) => {
        try {
            const uid = parseInt(req.params.uid)
            const highlights = await Highlight.find({ userId: uid })

            for (const highlight of highlights) {
                const getObjectParams = {
                    Bucket: process.env.BUCKET_NAME!!,
                    Key: highlight.highlightUrl
                }

                const command = new GetObjectCommand(getObjectParams)
                const url = await getSignedUrl(client, command, { expiresIn: 3600 })
                highlight!!.highlightUrl = url
            }

            res.status(200).json(highlights)

        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch highlights', details: error })
        }
    })

    return router
}

export default highlightRoute