import mongoose, { Schema, Document } from "mongoose"
import { Post } from "./Post"
import { Highlight } from "./Highlight"

export interface User extends Document {
  id: number
  username: string
  profileImageUrl: string
  postsCount: string
  followersCount: string
  followingCount: string
  fullName: string
  bio: string
  highlights?: Highlight[]
  posts?: Post[]
  private: boolean
}

const userSchema = new Schema<User>({
  id: { type: Number, required: true },
  username: { type: String, required: true },
  profileImageUrl: { type : String, default: "" },
  postsCount: { type: String, default: "" },
  followersCount: { type: String, default: "" },
  followingCount: { type: String, default: "" },
  fullName: { type: String, required: true },
  bio: { type: String, required: true },
  highlights: [],
  posts: [],
  private: { type: Boolean, default: false }
})

export const User = mongoose.model<User>("User", userSchema, "users")