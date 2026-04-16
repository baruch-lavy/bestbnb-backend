import express from 'express'
import { getStays, getStayById, addStay, updateStay, deleteStay } from './stay.controller.js'

const router = express.Router()

router.get('/', getStays)  // ✅ Get all stays
router.get('/:id', getStayById)  // ✅ Get single stay
router.post('/', addStay)  // ✅ Add stay
router.put('/:id', updateStay)  // ✅ Update stay
router.delete('/:id', deleteStay)  // ✅ Delete stay

export const stayRoutes = router
