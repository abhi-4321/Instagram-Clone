import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const connectDB = async () => {
  try {
    const dbUri = process.env.MONGO_URI!!
    await mongoose.connect(dbUri, {
      dbName: "myDatabase"
    });
    console.log("MongoDB connected successfully")
  } catch (error) {
    console.error("Error connecting to MongoDB:", error)
    process.exit(1)
  }
}

export default connectDB