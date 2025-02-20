import { ObjectId } from 'mongodb'
import { asyncLocalStorage } from '../../services/als.service.js'
import { logger } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js' // ✅ FIXED IMPORT

export const reviewService = { query, remove, add }

async function query(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection('review')

        console.log("🔎 Querying reviews with criteria:", criteria) // Debugging

        var reviews = await collection.aggregate([
            { $match: criteria },
            {
                $lookup: {
                    localField: 'byUserId',
                    from: 'user',
                    foreignField: '_id',
                    as: 'byUser',
                },
            },
            { $unwind: '$byUser' },
            {
                $lookup: {
                    localField: 'aboutUserId',
                    from: 'user',
                    foreignField: '_id',
                    as: 'aboutUser',
                },
            },
            { $unwind: '$aboutUser' },
        ]).toArray()

        reviews = reviews.map(review => ({
            ...review,
            byUser: { _id: review.byUser._id, fullname: review.byUser.fullname },
            aboutUser: { _id: review.aboutUser._id, fullname: review.aboutUser.fullname },
        }))

        return reviews
    } catch (err) {
        logger.error('❌ Cannot get reviews', err)
        throw err
    }
}

async function remove(reviewId) {
    try {
        const { loggedinUser } = asyncLocalStorage.getStore()
        if (!loggedinUser) throw new Error("User not logged in")

        const collection = await dbService.getCollection('review')

        const criteria = { _id: new ObjectId(reviewId) }

        // Remove only if the user is the owner OR an admin
        if (!loggedinUser.isAdmin) {
            criteria.byUserId = new ObjectId(loggedinUser._id)
        }

        const { deletedCount } = await collection.deleteOne(criteria)
        return deletedCount
    } catch (err) {
        logger.error(`❌ Cannot remove review ${reviewId}`, err)
        throw err
    }
}

async function add(review) {
    try {
        const { loggedinUser } = asyncLocalStorage.getStore()
        if (!loggedinUser) throw new Error("User not logged in")

        const reviewToAdd = {
            byUserId: new ObjectId(loggedinUser._id), // ✅ Automatically set `byUserId`
            aboutUserId: new ObjectId(review.aboutUserId),
            txt: review.txt,
        }

        const collection = await dbService.getCollection('review')
        const result = await collection.insertOne(reviewToAdd)

        reviewToAdd._id = result.insertedId // ✅ Add the ID to the review object
        return reviewToAdd
    } catch (err) {
        logger.error('❌ Cannot add review', err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}

    if (filterBy.byUserId) {
        criteria.byUserId = new ObjectId(filterBy.byUserId)
    }

    return criteria
}
