import express, { Express, Request, Response } from 'express'
import connectDb from './util/db'
import Routes from './routes'
import dotenv from 'dotenv'
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";

const app: Express = express()

dotenv.config()
connectDb()

const PORT = process.env.PORT || 3000
app.use(express.json())
app.use('/', Routes)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT)
})
