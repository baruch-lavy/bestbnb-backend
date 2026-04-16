import express from 'express'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { getOrders, getOrderById, addOrder, updateOrder, deleteOrder , getOrdersByUser } from './order.controller.js'

const router = express.Router()

// ✅ Public Routes
router.get('/', getOrders)
router.get('/:id', getOrderById)

// ✅ Protected Routes (Require Auth)
router.post('/', requireAuth, addOrder)
router.put('/:id', requireAuth, updateOrder)
router.delete('/:id', requireAuth, deleteOrder)
router.get('/user/:userId', requireAuth, getOrdersByUser)
// router.get('/host',requireAuth, getOrdersByHostController)



export const orderRoutes = router
