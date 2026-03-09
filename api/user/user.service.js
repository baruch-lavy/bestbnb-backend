import { dbService } from "../../services/db.service.js";
import { logger } from "../../services/logger.service.js";
import { asyncLocalStorage } from "../../services/als.service.js";
import { ObjectId } from "mongodb";

export const userService = {
  add,
  getById,
  update,
  remove,
  query,
  getByUsername,
  addToWishlist,
  removeFromWishlist,
};

//  GET ALL USERS
async function query(filterBy = {}) {
  const criteria = _buildCriteria(filterBy);
  try {
    const collection = await dbService.getCollection("agents");
    let users = await collection.find(criteria).toArray();

    users = users.map((user) => {
      delete user.password;
      user.createdAt = user._id.getTimestamp();
      return user;
    });

    return users;
  } catch (err) {
    logger.error("Cannot find users", err);
    throw err;
  }
}

//  GET USER BY ID
async function getById(userId) {
  try {
    const collection = await dbService.getCollection("agents");
    const user = await collection.findOne({
      _id: ObjectId.createFromHexString(userId),
    });

    if (!user) throw new Error("User not found");

    delete user.password;
    return user;
  } catch (err) {
    logger.error(`Failed to find user by id: ${userId}`, err);
    throw err;
  }
}

//  GET USER BY USERNAME(AGENT CODE)
async function getByUsername(username) {
  console.log(
    "~ file: user.service.js ~ line 68 ~ getByUsername ~ username",
    username,
  );
  try {
    const collection = await dbService.getCollection("agents");
    return await collection.findOne({ agentCode: username });
  } catch (err) {
    logger.error(`Failed to find user by agent code: ${username}`, err);
    throw err;
  }
}

//  ADD USER
async function add(user) {
  console.log("~ file: user.service.js ~ line 86 ~ add ~ user", user);
  try {
    const userToAdd = {
      fullname: user.fullname,
      agentCode: user.agentCode,
      password: user.password,
      imgUrl: user.imgUrl || "",
      role: user.role,
      joinedAt: new Date(),
      reports: [], // For agent users, this can hold their listings or bookings
    };
    console.log(
      "~ file: user.service.js ~ line 96 ~ add ~ userToAdd",
      userToAdd,
    );

    const collection = await dbService.getCollection("agents");
    const result = await collection.insertOne(userToAdd);
    // await collection.updateOne(
    //     { _id: result.insertedId },
    //     { $set: { orders: [] } }
    // )

    userToAdd._id = result.insertedId;
    delete userToAdd.password;
    return userToAdd;
  } catch (err) {
    logger.error("Cannot add user", err);
    throw err;
  }
}

//  DELETE USER (With ALS)
async function remove(userId) {
  try {
    const { loggedinUser } = asyncLocalStorage.getStore();
    if (!loggedinUser.isAdmin) throw new Error("Unauthorized action");

    const collection = await dbService.getCollection("agents");
    const result = await collection.deleteOne({
      _id: ObjectId.createFromHexString(userId),
    });

    if (result.deletedCount === 0) throw new Error("User not found");
    return userId;
  } catch (err) {
    logger.error(`Cannot remove user ${userId}`, err);
    throw err;
  }
}

// UPDATE USER (With ALS)
async function update(userId, userUpdates) {
  try {
    if (!ObjectId.isValid(userId)) throw new Error("Invalid user ID");

    const { loggedinUser } = asyncLocalStorage.getStore();
    if (loggedinUser._id !== userId && !loggedinUser.isAdmin) {
      throw new Error("Unauthorized action");
    }

    const collection = await dbService.getCollection("agents");
    const objectId = ObjectId.createFromHexString(userId);

    //  Debugging: Check if the user exists before updating
    const existingUser = await collection.findOne({ _id: objectId });
    if (!existingUser) throw new Error(`🚨 User not found in DB: ${userId}`);

    //  Filter allowed fields (Do NOT allow updating `username` or `password`)
    const userToSave = {};
    if (
      userUpdates.fullname &&
      userUpdates.fullname !== existingUser.fullname
    ) {
      userToSave.fullname = userUpdates.fullname;
    }
    if (userUpdates.imgUrl && userUpdates.imgUrl !== existingUser.imgUrl) {
      userToSave.imgUrl = userUpdates.imgUrl;
    }
    if (
      Array.isArray(userUpdates.wishlist) &&
      JSON.stringify(userUpdates.wishlist) !==
        JSON.stringify(existingUser.wishlist)
    ) {
      userToSave.wishlist = userUpdates.wishlist;
    }

    if (Object.keys(userToSave).length === 0)
      throw new Error(
        "🚨 No changes detected. MongoDB ignores identical updates.",
      );

    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: userToSave },
      { returnDocument: "after" },
    );

    if (!result.value) throw new Error(`🚨 User not updated: ${userId}`);

    return result.value;
  } catch (err) {
    logger.error(`Cannot update user ${userId}`, err);
    throw err;
  }
}

//  ADD TO WISHLIST (With ALS)
async function addToWishlist(stayId) {
  try {
    const { loggedinUser } = asyncLocalStorage.getStore();
    if (!loggedinUser) throw new Error("User not logged in");

    const collection = await dbService.getCollection("agents");
    const updatedUser = await collection.findOneAndUpdate(
      { _id: ObjectId.createFromHexString(loggedinUser._id) },
      { $addToSet: { wishlist: ObjectId.createFromHexString(stayId) } },
      { returnDocument: "after" },
    );

    return updatedUser.value;
  } catch (err) {
    logger.error(`Cannot add stay ${stayId} to wishlist for user`, err);
    throw err;
  }
}

//  REMOVE FROM WISHLIST (With ALS)
async function removeFromWishlist(stayId) {
  try {
    const { loggedinUser } = asyncLocalStorage.getStore();
    if (!loggedinUser) throw new Error("User not logged in");

    const collection = await dbService.getCollection("agents");
    const updatedUser = await collection.findOneAndUpdate(
      { _id: ObjectId.createFromHexString(loggedinUser._id) },
      { $pull: { wishlist: ObjectId.createFromHexString(stayId) } },
      { returnDocument: "after" },
    );

    return updatedUser.value;
  } catch (err) {
    logger.error(`Cannot remove stay ${stayId} from wishlist for user`, err);
    throw err;
  }
}

//  FILTER FUNCTION
function _buildCriteria(filterBy) {
  const criteria = {};
  if (filterBy.txt) {
    const txtCriteria = { $regex: filterBy.txt, $options: "i" };
    criteria.$or = [{ username: txtCriteria }, { fullname: txtCriteria }];
  }
  if (filterBy.role) {
    criteria.role = filterBy.role;
  }
  return criteria;
}
