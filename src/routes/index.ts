import { Router } from 'express'

import sendMessage from './sendMessage'

const routes = Router()

sendMessage(routes)

export default routes
