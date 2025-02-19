import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'

export const userService = {
	add,
	getById,
	update,
	remove,
	query,
	getByUsername,
	addToWishlist,
	removeFromWishlist
}

// ✅ GET ALL USERS
async function query(filterBy = {}) {
    const criteria = _buildCriteria(filterBy)
    try {
        const collection = await dbService.getCollection('user')
        var users = await collection.find(criteria).toArray()
        users = users.map(user => {
            delete user.password
            user.createdAt = user._id.getTimestamp()
            return user
        })
        return users
    } catch (err) {
        logger.error('Cannot find users', err)
        throw err
    }
}

// ✅ GET USER BY ID
async function getById(userId) {
    try {
        const criteria = { _id: new ObjectId(userId) }
        const collection = await dbService.getCollection('user')
        const user = await collection.findOne(criteria)
        if (!user) throw new Error('User not found')
        delete user.password
        return user
    } catch (err) {
        logger.error(`Failed to find user by id: ${userId}`, err)
        throw err
    }
}

// ✅ GET USER BY USERNAME
async function getByUsername(username) {
	try {
		const collection = await dbService.getCollection('user')
		const user = await collection.findOne({ username })
		return user
	} catch (err) {
		logger.error(`Failed to find user by username: ${username}`, err)
		throw err
	}
}

async function add(user) {
	try {
		const userToAdd = {
			username: user.username,
			password: user.password, // Hashed password should be stored (hash before calling this function)
			fullname: user.fullname,
			imgUrl: user.imgUrl || '',
			isAdmin: user.isAdmin || false,
			wishlist: [], // Users start with an empty wishlist
			joinedAt: new Date(),
		}
		const collection = await dbService.getCollection('user')
		const result = await collection.insertOne(userToAdd)
		userToAdd._id = result.insertedId // Assign generated ID to the new user
		delete userToAdd.password // Ensure we don't expose passwords
		return userToAdd
	} catch (err) {
		logger.error('Cannot add user', err)
		throw err
	}
}


// ✅ DELETE USER
async function remove(userId) {
    try {
        const criteria = { _id: new ObjectId(userId) }
        const collection = await dbService.getCollection('user')
        await collection.deleteOne(criteria)
    } catch (err) {
        logger.error(`Cannot remove user ${userId}`, err)
        throw err
    }
}

// ✅ UPDATE USER
async function update(userId, userUpdates) {
    try {
        if (!ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID");
        }

        const collection = await dbService.getCollection('user');
        const objectId = new ObjectId(userId);

        // ✅ Debugging: Check if the user exists before updating
        const existingUser = await collection.findOne({ _id: objectId });
        if (!existingUser) {
            throw new Error(`🚨 User not found in DB: ${userId}`);
        }
        // console.log(`✅ User with ID ${userId} exists in DB? TRUE`);

        // ✅ Filter allowed fields (Do NOT allow updating `username` or `password`)
        const userToSave = {};
        if (userUpdates.fullname && userUpdates.fullname !== existingUser.fullname) {
            userToSave.fullname = userUpdates.fullname;
        }
        if (userUpdates.imgUrl && userUpdates.imgUrl !== existingUser.imgUrl) {
            userToSave.imgUrl = userUpdates.imgUrl;
        }
        if (Array.isArray(userUpdates.wishlist) && JSON.stringify(userUpdates.wishlist) !== JSON.stringify(existingUser.wishlist)) {
            userToSave.wishlist = userUpdates.wishlist;
        }

        if (Object.keys(userToSave).length === 0) {
            throw new Error("🚨 No changes detected. MongoDB ignores identical updates.");
        }

        // ✅ Run update
        const result = await collection.findOneAndUpdate(
            { _id: objectId },
            { $set: userToSave },
            { returnDocument: "after" }
        );

        if (!result.value) {
            throw new Error(`🚨 User not updated: ${userId}`);
        }

        // console.log("✅ Updated user:", result.value);
        return result.value;
    } catch (err) {
        console.error(`❌ Error updating user ${userId}:`, err.message);
        throw err;
    }
}


// ✅ ADD TO WISHLIST
async function addToWishlist(userId, stayId) {
    try {
        const collection = await dbService.getCollection('user')
        const updatedUser = await collection.findOneAndUpdate(
            { _id: new ObjectId(userId) },
            { $addToSet: { wishlist: new ObjectId(stayId) } },
            { returnDocument: 'after' }
        )
        return updatedUser.value
    } catch (err) {
        logger.error(`Cannot add stay ${stayId} to wishlist for user ${userId}`, err)
        throw err
    }
}

// ✅ REMOVE FROM WISHLIST
async function removeFromWishlist(userId, stayId) {
    try {
        const collection = await dbService.getCollection('user')
        const updatedUser = await collection.findOneAndUpdate(
            { _id: new ObjectId(userId) },
            { $pull: { wishlist: new ObjectId(stayId) } },
            { returnDocument: 'after' }
        )
        return updatedUser.value
    } catch (err) {
        logger.error(`Cannot remove stay ${stayId} from wishlist for user ${userId}`, err)
        throw err
    }
}

// ✅ FILTER FUNCTION
function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.txt) {
        const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
        criteria.$or = [{ username: txtCriteria }, { fullname: txtCriteria }]
    }
    if (filterBy.role) {
        criteria.role = filterBy.role
    }
    return criteria
}
