import express from 'express'
import { getStays, getStayById, addStay, updateStay, deleteStay, getReviewerProfile } from './stay.controller.js'

const router = express.Router()

router.get('/', getStays)  // ✅ Get all stays
router.get('/reviewer/:id', getReviewerProfile)  // ✅ Get reviewer/host profile (must be before /:id)
router.get('/:id', getStayById)  // ✅ Get single stay
router.post('/', addStay)  // ✅ Add stay
router.put('/:id', updateStay)  // ✅ Update stay
router.delete('/:id', deleteStay)  // ✅ Delete stay

export const stayRoutes = router
