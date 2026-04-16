import express from 'express'
import { parseFilter } from './ai.controller.js'

const router = express.Router()

router.post('/parse-filter', parseFilter)

export const aiRoutes = router
