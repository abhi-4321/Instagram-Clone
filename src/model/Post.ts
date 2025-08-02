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
    username: string
    profileImageUrl: string
    createdAt: Date
}

const postSchema = new Schema<Post>({
    id: { type: Number, required: true },
    userId: { type: Number, required: true },
    postUrl: { type: String, default: ""},
    caption: String,
    likesCount: { type: String, default: "0" },
    likedBy: { type: [], default: [] },
    commentsCount: { type: String, default: "0" },
    comments: { type: [], default: [] },
    username: { type: String, required: true },
    profileImageUrl: { type: String, default: ""},
    createdAt: { type: Date, default: Date.now }
})

export const Post = mongoose.model<Post>("Post", postSchema, "posts")
