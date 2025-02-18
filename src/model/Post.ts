import mongoose, { Schema, Document } from "mongoose"
import { Comment } from './Comment'

export interface Post extends Document {
    id: number
    userId: number
    postUrl: string
    caption: string
    likesCount: string
    likedBy: number[]
    commentsCount: string
    comments: Comment[]
}

const postSchema = new Schema<Post>({
    id: { type: Number, required: true },
    userId: { type: Number, required: true },
    postUrl: { type: String, default: ""},
    caption: String,
    likesCount: { type: String, default: "0" },
    likedBy: { type: [], default: [] },
    commentsCount: { type: String, default: "0" },
    comments: { type: [], default: [] }
})

export const Post = mongoose.model<Post>("Post", postSchema, "posts")
