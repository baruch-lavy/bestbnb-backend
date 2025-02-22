import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'
import { ObjectId } from 'mongodb'

const COLLECTION_NAME = 'order' // ✅ Add this at the top


export const orderService = {
    query,
    getById,
    add,
    update,
    remove,
    getOrdersByUser,
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

async function getOrdersByUser(userId) {
    console.log('🔍 Checking userId:', userId) // Debugging log

    if (!ObjectId.isValid(userId)) throw new Error(`Invalid ObjectId: ${userId}`)

    const collection = await dbService.getCollection(COLLECTION_NAME)

    return collection.find({
        $or: [
            { "guest._id": userId }, // ✅ Match orders where user is stored as guest._id (String)
            { buyerId: new ObjectId(userId) } // ✅ Match orders where user is stored as buyerId (ObjectId)
        ]
    }).toArray()
}


// ✅ ADD ORDER (With ALS)
async function add(order) {
    try {
        const { loggedinUser } = asyncLocalStorage.getStore()
        if (!loggedinUser) throw new Error('User not logged in')

        const collection = await dbService.getCollection('order')

        const orderToAdd = {
            ...order,
            buyerId: new ObjectId(loggedinUser._id), // Assign the logged-in user as the buyer
            createdAt: new Date(),
        }

        const { insertedId } = await collection.insertOne(orderToAdd)

           // ✅ Add the order ID to the user's `orders` array
           const userCollection = await dbService.getCollection('user')
           await userCollection.updateOne(
               { _id: orderToAdd.buyerId },
               { $push: { orders: orderToAdd._id } }
           )

        return { ...orderToAdd, _id: insertedId }
    } catch (err) {
        logger.error('Failed to add order', err)
        throw err
    }
}

// ✅ UPDATE ORDER (With ALS)
async function update(orderId, orderUpdates) {
    try {
        const { loggedinUser } = asyncLocalStorage.getStore()
        if (!loggedinUser) throw new Error('User not logged in')

        const collection = await dbService.getCollection('order')
        const objectId = new ObjectId(orderId)

        // ✅ Fetch the order to verify ownership
        const existingOrder = await collection.findOne({ _id: objectId })
        if (!existingOrder) throw new Error('Order not found')

        // ✅ Only allow updating if the user is the buyer or an admin
        if (existingOrder.buyerId.toString() !== loggedinUser._id && !loggedinUser.isAdmin) {
            throw new Error('Unauthorized: Cannot update this order')
        }

        const result = await collection.findOneAndUpdate(
            { _id: objectId },
            { $set: orderUpdates },
            { returnDocument: 'after' }
        )

        if (!result.value) throw new Error('Order not updated')
        return result.value
    } catch (err) {
        logger.error(`Failed to update order ${orderId}`, err)
        throw err
    }
}

// ✅ DELETE ORDER (With ALS)
async function remove(orderId) {
    try {
        const { loggedinUser } = asyncLocalStorage.getStore()
        if (!loggedinUser) throw new Error('User not logged in')

        const collection = await dbService.getCollection('order')
        const objectId = new ObjectId(orderId)

        // ✅ Fetch the order to verify ownership
        const existingOrder = await collection.findOne({ _id: objectId })
        if (!existingOrder) throw new Error('Order not found')

        // ✅ Only allow deletion if the user is the buyer or an admin
        if (existingOrder.buyerId.toString() !== loggedinUser._id && !loggedinUser.isAdmin) {
            throw new Error('Unauthorized: Cannot delete this order')
        }

        const result = await collection.deleteOne({ _id: objectId })
        if (result.deletedCount === 0) throw new Error('Order not deleted')

        return orderId
    } catch (err) {
        logger.error(`Failed to delete order ${orderId}`, err)
        throw err
    }
}
