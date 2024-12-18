import express, { Express, Request, Response } from 'express'
import connectDb from './util/db'
import Routes from './util/routes'
import dotenv from 'dotenv'

const app: Express = express()

dotenv.config()
connectDb()

const PORT = process.env.PORT || 3000
app.use(express.json())
app.use('/', Routes)

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT)
})