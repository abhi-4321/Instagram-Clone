import mongoose, { Schema, Document, ObjectId } from "mongoose"

export interface Post extends Document {
    id: number
    userId: number
    postUrl: string
    caption: string
}

const postSchema = new Schema<Post>({
    id: { type: Number, required: true },
    userId: { type: Number, required: true },
    postUrl: { type: String, default: ""},
    caption: String
})

export const Post = mongoose.model<Post>("Post", postSchema, "posts")