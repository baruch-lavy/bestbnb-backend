import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'
import { ObjectId } from 'mongodb'

const COLLECTION_NAME = 'order' // ✅ Add this at the top


export const orderService = {
    query,
    getById,
    add,
    updateOrder,
    remove,
    getOrdersByUser,
    getOrdersByHost
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

// ✅ GET ORDERS BY HOST
export async function getOrdersByHost(hostId) {
    console.log(`🟢 Entering getOrdersByHost() with hostId:`, hostId)

    try {
        if (!ObjectId.isValid(hostId)) {
            console.warn(`⚠️ Invalid ObjectId received. Returning empty result.`)
            return []
        }

        const objectId = new ObjectId(hostId)

        console.log(`🔍 Querying orders where hostId._id =`, objectId)

        const collection = await dbService.getCollection('order')
        console.log(`🔍 Collection found:`, collection.collectionName)

        // ✅ Fix the query to match `hostId._id`
        const orders = await collection.find({ "hostId._id": hostId }).toArray()

        console.log(`✅ Orders found:`, orders.length)

        return orders
    } catch (err) {
        console.error("❌ Failed to fetch orders by host:", err)
        throw err
    }
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
import { socketService } from '../../services/socket.service.js'
export async function updateOrder(orderId, orderUpdates) {
    console.log(`🟢 Entering updateOrder() for ID:`, orderId, orderUpdates)

    try {
        const store = asyncLocalStorage.getStore()
        if (!store || !store.loggedinUser) {
            console.error('❌ Not authenticated - No user session')
            throw new Error('Not authenticated')
        }

        const userId = store.loggedinUser._id?.toString().trim()
        console.log('🆔 Logged-in user:', userId)

        const collection = await dbService.getCollection('order')

        const objectId = new ObjectId(orderId)
        const order = await collection.findOne({ _id: objectId })

        if (!order) {
            console.error(`❌ Order not found for ID:`, orderId)
            throw new Error('Order not found')
        }

        // ✅ Check if the user is the host OR the buyer
        const isBuyer = order.buyerId?.toString() === userId
        const isHost = order.hostId._id?.toString() === userId

        if (!isBuyer && !isHost) {
            console.error(`❌ Unauthorized: User ${userId} cannot update this order`)
            throw new Error('Unauthorized: Cannot update this order')
        }

        // ✅ Allow only `status` updates
        const allowedUpdates = { status: orderUpdates.status }
        console.log(`🟢 Updating order in MongoDB with:`, allowedUpdates)

        const result = await collection.updateOne(
            { _id: objectId },
            { $set: allowedUpdates }
        )

        console.log(`🟢 MongoDB Update Result:`, result)

        if (result.matchedCount === 0) {
            console.error(`❌ Order not updated in MongoDB - No document matched`)
            throw new Error('Order not updated')
        }

        // ✅ Fetch the updated order to return
        const updatedOrder = await collection.findOne({ _id: objectId })

         // 🔥 Emit real-time update to all clients
         socketService.emitToUser({
            type: `order-updated`, // Notify the buyer
            data: updatedOrder,
            userId: updatedOrder.buyerId
        })

        socketService.emitToUser({
            type: `new-oreder-msg`, // Notify the buyer
            data: updatedOrder,
            userId: updatedOrder.buyerId
        })

         
        console.log(`✅ Order updated successfully!`, updatedOrder)
        return updatedOrder
    } catch (err) {
        console.error(`❌ Failed to update order ${orderId}`, err)
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
