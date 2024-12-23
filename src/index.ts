import express, { Express } from 'express'
import connectDb from './util/db'
import Routes from './routes'
import dotenv from 'dotenv'
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs"

const app: Express = express()
const swaggerDocument = YAML.load("./src/openapi/swagger.yaml");

dotenv.config()
connectDb()

const PORT = process.env.PORT || 3000
app.use(express.json())
app.use('/', Routes)
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT)
})
