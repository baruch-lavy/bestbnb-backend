import { ObjectId } from 'mongodb'
import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

const PAGE_SIZE = 6

export const stayService = {
    query,
    getById,
    remove,
    add,
    update,
    addStayMsg,
    removeStayMsg,
}

// ✅ FETCH STAYS WITH FILTERING & PAGINATION
async function query(filterBy = {}) {
    try {
        const collection = await dbService.getCollection('stay')
        
        // ✅ Build the filter criteria
        const criteria = {}

        // ✅ Filter by destination
        if (filterBy.destination && filterBy.destination !== '') {
            const regex = new RegExp(filterBy.destination, 'i')
            criteria['loc.city'] = regex
        }

        // ✅ Filter by guests (Only if guests > 0)
        if (filterBy.guests && filterBy.guests > 0) {
            criteria.capacity = { $gte: filterBy.guests }
        }

        // ✅ Filter by price range
        const minPrice = parseInt(filterBy.minPrice) || 0
        const maxPrice = filterBy.maxPrice === 'Infinity' ? Number.MAX_SAFE_INTEGER : parseInt(filterBy.maxPrice)
        criteria.price = { $gte: minPrice, $lte: maxPrice }

        // ✅ Filter by search text (applies to stay name and description)
        if (filterBy.txt && filterBy.txt.trim() !== '') {
            const regex = new RegExp(filterBy.txt, 'i')
            criteria.$or = [{ name: regex }, { summary: regex }]
        }

        console.log("🔍 Querying stays with criteria:", criteria)

        // ✅ Fetch stays from MongoDB
        const stays = await collection.find(criteria).toArray()
        return stays
    } catch (err) {
        logger.error('❌ Failed to fetch stays', err)
        throw err
    }
}


// ✅ GET A SINGLE STAY BY ID
async function getById(stayId) {
    try {
        const collection = await dbService.getCollection('stay')
        const stay = await collection.findOne({ _id: new ObjectId(stayId) })

        if (!stay) throw new Error(`Stay ${stayId} not found`)
        return stay
    } catch (err) {
        logger.error(`❌ Error finding stay ${stayId}:`, err)
        throw err
    }
}

// ✅ DELETE A STAY
async function remove(stayId) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    const { _id: ownerId, isAdmin } = loggedinUser

    try {
        const collection = await dbService.getCollection('stay')
        const criteria = { _id: new ObjectId(stayId) }
        if (!isAdmin) criteria['owner._id'] = ownerId

        const res = await collection.deleteOne(criteria)
        if (res.deletedCount === 0) throw new Error('Not authorized to delete this stay')

        return stayId
    } catch (err) {
        logger.error(`❌ Cannot remove stay ${stayId}:`, err)
        throw err
    }
}

// ✅ ADD A NEW STAY
async function add(stay) {
    try {
        const collection = await dbService.getCollection('stay')
        await collection.insertOne(stay)
        return stay
    } catch (err) {
        logger.error('❌ Cannot insert stay:', err)
        throw err
    }
}

// ✅ UPDATE A STAY
export async function update(stayId, stayData) {
    try {
        const collection = await dbService.getCollection('stay')
        const criteria = { _id: new ObjectId(stayId) }

        console.log("🔍 Updating stay:", criteria, stayData)  // 🚀 Debugging

        const updateRes = await collection.updateOne(criteria, { $set: stayData })

        if (updateRes.modifiedCount === 0) {
            console.log("⚠️ No stay was updated. Check if the ID exists.")
            return null
        }

        console.log("✅ Stay successfully updated:", stayData)  // 🚀 Debugging
        return { _id: stayId, ...stayData }
    } catch (err) {
        console.error("❌ Error updating stay:", err)
        throw err
    }
}
// ✅ ADD A MESSAGE/REVIEW TO A STAY
async function addStayMsg(stayId, msg) {
    try {
        const collection = await dbService.getCollection('stay')
        msg.id = makeId()

        await collection.updateOne({ _id: new ObjectId(stayId) }, { $push: { msgs: msg } })
        return msg
    } catch (err) {
        logger.error(`❌ Cannot add stay message ${stayId}:`, err)
        throw err
    }
}

// ✅ REMOVE A MESSAGE/REVIEW FROM A STAY
async function removeStayMsg(stayId, msgId) {
    try {
        const collection = await dbService.getCollection('stay')
        await collection.updateOne({ _id: new ObjectId(stayId) }, { $pull: { msgs: { id: msgId } } })

        return msgId
    } catch (err) {
        logger.error(`❌ Cannot remove stay message ${stayId}:`, err)
        throw err
    }
}

// ✅ BUILD QUERY FILTERS
function _buildCriteria(filterBy) {
    const criteria = {}

    if (filterBy.destination) {
        const regex = new RegExp(filterBy.destination, 'i')
        criteria['loc.city'] = { $regex: regex }
    }

    if (filterBy.guests) {
        criteria.capacity = { $gte: filterBy.guests }
    }

    if (filterBy.minPrice !== undefined && filterBy.maxPrice !== undefined) {
        criteria.price = { $gte: filterBy.minPrice, $lte: filterBy.maxPrice }
    }

    if (filterBy.category) {
        criteria.labels = { $in: [filterBy.category.toLowerCase()] }
    }

    return criteria
}

// ✅ BUILD SORT ORDER
function _buildSort(filterBy) {
    const sort = {}

    if (filterBy.sortBy) {
        sort[filterBy.sortBy] = filterBy.sortDir === 'desc' ? -1 : 1
    }

    return sort
}
