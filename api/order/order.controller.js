import { orderService } from './order.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'

// ✅ GET ALL ORDERS
export async function getOrders(req, res) {
    try {
        console.log('🔵 Entering getOrders() with query:', req.query)

        // ✅ Get `hostId` from query params
        const { hostId } = req.query
        console.log('🆔 Host ID from query:', hostId)

        if (!hostId) {
            return res.status(400).json({ error: 'Missing hostId in query' })
        }

        // ✅ Fetch only orders for the requested `hostId`
        const orders = await orderService.getOrdersByHost(hostId)
        console.log('✅ Orders fetched:', orders.length)

        res.json(orders)
    } catch (err) {
        console.error('❌ Failed to fetch orders:', err)
        res.status(500).json({ error: 'Failed to fetch orders' })
    }
}

// ✅ GET SINGLE ORDER BY ID
export async function getOrderById(req, res) {
    try {
        const order = await orderService.getById(req.params.id)
        res.json(order)
    } catch (err) {
        logger.error('Failed to fetch order', err)
        res.status(500).json({ error: 'Failed to fetch order' })
    }
}

export async function getOrdersByUser(req, res) {
    console.log('req.params:', req.params)
    try {
        const userId = req.params.userId
        if (!userId) return res.status(400).json({ error: 'User ID is required' })

        const orders = await orderService.getOrdersByUser(userId) // ✅ Use orderService
        res.json(orders)
    } catch (error) {
        logger.error('Failed to fetch user orders:', error)
        res.status(500).json({ error: 'Failed to fetch orders' })
    }
}

// ✅ ADD NEW ORDER
export async function addOrder(req, res) {
    console.log('req.body:', req.body)
    try {
        const addedOrder = await orderService.add(req.body)
        res.json(addedOrder)
    } catch (err) {
        logger.error('Failed to add order', err)
        res.status(500).json({ error: 'Failed to add order' })
    }
}

// ✅ UPDATE ORDER
export async function updateOrder(req, res) {
    try {
        const { status } = req.body // ✅ Extract status from request body
        console.log('status:', status)
        const orderId = req.params.id

        if (!ObjectId.isValid(orderId)) {
            return res.status(400).json({ error: 'Invalid Order ID' }) // ✅ Handle invalid ObjectId
        }

        const updatedOrder = await orderService.updateOrder(orderId, { status }) // ✅ Use service
        if (!updatedOrder) return res.status(404).json({ error: 'Order not found' }) // ✅ Handle missing order

        res.json(updatedOrder)
    } catch (err) {
        console.error("❌ Failed to update order:", err)
        res.status(500).json({ error: "Failed to update order" })
    }
}


// ✅ DELETE ORDER
export async function deleteOrder(req, res) {
    try {
        await orderService.remove(req.params.id)
        res.json({ message: 'Order deleted successfully' })
    } catch (err) {
        logger.error('Failed to delete order', err)
        res.status(500).json({ error: 'Failed to delete order' })
    }
}
