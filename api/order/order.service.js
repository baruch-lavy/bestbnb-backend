import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'

export const orderService = {
    query,
    getById,
    add,
    update,
    remove,
}

// ✅ GET ALL ORDERS
async function query(filterBy = {}) {
    try {
        const collection = await dbService.getCollection('order')
        return await collection.find().toArray()
    } catch (err) {
        logger.error('Cannot get orders', err)
        throw err
    }
}

// ✅ GET ORDER BY ID
async function getById(orderId) {
    try {
        const collection = await dbService.getCollection('order')
        return await collection.findOne({ _id: new ObjectId(orderId) })
    } catch (err) {
        logger.error(`Failed to get order ${orderId}`, err)
        throw err
    }
}

// ✅ ADD ORDER
async function add(order) {
    try {
        const collection = await dbService.getCollection('order')
        const { insertedId } = await collection.insertOne(order)
        return { ...order, _id: insertedId }
    } catch (err) {
        logger.error('Failed to add order', err)
        throw err
    }
}

// ✅ UPDATE ORDER
async function update(orderId, orderUpdates) {
    try {
        const collection = await dbService.getCollection('order')
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            { $set: orderUpdates },
            { returnDocument: 'after' }
        )

        if (!result.value) throw new Error('Order not found')
        return result.value
    } catch (err) {
        logger.error(`Failed to update order ${orderId}`, err)
        throw err
    }
}

// ✅ DELETE ORDER
async function remove(orderId) {
    try {
        const collection = await dbService.getCollection('order')
        const result = await collection.deleteOne({ _id: new ObjectId(orderId) })
        if (result.deletedCount === 0) throw new Error('Order not found')
        return orderId
    } catch (err) {
        logger.error(`Failed to delete order ${orderId}`, err)
        throw err
    }
}
