import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'
import { errors } from 'celebrate'
import swaggerUI from 'swagger-ui-express'

import routes from './routes'

let publicAccessDocuments

dotenv.config()
const app = express()
const server = http.createServer(app)

if (process.env.NODE_ENV === 'production') {
  publicAccessDocuments = require('./../../docs/public_access_docs.json')
} else {
  publicAccessDocuments = require('./../docs/public_access_docs.json')
}

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['*'],
  exposedHeaders: ['Authorization', 'Content-Type', 'Content-Disposition', 'Access-Control-Allow-Headers', 'Origin', 'Accept', 'X-Requested-With', 'filename'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}))
app.use(express.json())

app.use(routes)

// docs
app.use('/public/docs', swaggerUI.serve, swaggerUI.setup(publicAccessDocuments))

// celebrate errors
app.use(errors())

const PORT = !process.env.PORT ? 3333 :  process.env.PORT
const processName = process.env.name || 'primary'

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})