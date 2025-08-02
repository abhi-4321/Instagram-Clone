import mongoose, { Schema } from "mongoose"

export interface Saved extends Document {
    userId: number,
    postId: number,
}

const savedSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true }
})

savedSchema.index({ userId: 1, postId: 1 }, { unique: true }) // prevent duplicates

export const Saved = mongoose.model('Saved', savedSchema, "saved")