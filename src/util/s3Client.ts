import { S3Client } from "@aws-sdk/client-s3"
import dotenv from 'dotenv'

dotenv.config()

// AWS S3 Client
const client = new S3Client({
    credentials: {
        accessKeyId: process.env.ACCESS_KEY!!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!!
    },
    region: process.env.BUCKET_REGION!!
})

export default client