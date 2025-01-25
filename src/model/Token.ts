import mongoose, {Document} from "mongoose"

export interface Token extends Document {
    userId: number
    token: string
}

const tokenSchema = new mongoose.Schema({
    userId: { type: Number, required: true, unique: true },
    token: { type: String, required: true, unique: true },
})

export const Token = mongoose.model<Token>("Token", tokenSchema, "tokens")
