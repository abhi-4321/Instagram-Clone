import mongoose, {Document} from "mongoose"

export interface Token extends Document {
    userId: number
    token: string
    createdAt: Date
}

const tokenSchema = new mongoose.Schema({
    userId: { type: Number, required: true, unique: true },
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
})

tokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1209600 })

export const Token = mongoose.model<Token>("Token", tokenSchema, "tokens")
