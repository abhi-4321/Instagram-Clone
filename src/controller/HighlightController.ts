import {Request, Response} from "express"
import {Highlight} from '../model/Highlight'
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
import client from "../util/s3Client"
import {GetObjectCommand} from "@aws-sdk/client-s3";

const createHighlight = async (req: Request, res: Response) => {
    try {
        const highlightId = parseInt(req.params.highlightId)

        if (!highlightId) {
            res.status(400).json({ message: "Bad Request" })
            return
        }

        const highlight = await Highlight.findOne({ id: highlightId })

        if (!highlight) {
            res.status(404).json({ message: "Not found" })
            return
        }

        highlight.highlighted = true
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
            return
        }

        highlight.highlighted = false
        const deleteHighlight = await highlight.save()

        if (!deleteHighlight) {
            res.status(500).send({ message: "Unknown error occurred" })
        } else {
            res.status(200).send({ message: "Highlight deleted" })
        }
    } catch (error: any) {
        res.status(500).send({ message: "Unknown error occurred ", details: error })
    }
}

const getHighlight = async (req: Request, res: Response) => {
    try {
        const highlightId = parseInt(req.params.highlightId)
        const highlight = await Highlight.findOne({ id: highlightId })

        if (!highlight) {
            res.status(404).json({ error: 'Highlight not found' })
        } else {
            const getObjectParams = {
                Bucket: process.env.BUCKET_NAME!!,
                Key: highlight?.highlightUrl
            }

            const command = new GetObjectCommand(getObjectParams)
            highlight!!.highlightUrl = await getSignedUrl(client, command, {expiresIn: 3600})

            res.status(200).json(highlight)
        }
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch highlight', details: error })
    }
}

const allHighlights = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const highlights = await Highlight.find({ userId: userId, highlighted: true })

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

const fetchPastStories = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const highlights = await Highlight.find({ userId: userId, highlighted: false })

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
        res.status(500).json({ error: 'Failed to fetch stories', details: error })
    }
}

export default {
    createHighlight,
    deleteHighlight,
    getHighlight,
    allHighlights,
    fetchPastStories
}
