import { userService } from "./user.service.js";
import { logger } from "../../services/logger.service.js";

//  GET USER BY ID
export async function getUser(req, res) {
  try {
    const user = await userService.getById(req.params.id);
    res.send(user);
  } catch (err) {
    logger.error("Failed to get user", err);
    res.status(400).send({ err: "Failed to get user" });
  }
}

//  GET ALL USERS (with optional filtering)
export async function getUsers(req, res) {
  try {
    const filterBy = {
      txt: req.query?.txt || "",
      role: req.query?.role || null,
    };
    const users = await userService.query(filterBy);
    res.send(users);
  } catch (err) {
    logger.error("Failed to get users", err);
    res.status(400).send({ err: "Failed to get users" });
  }
}

//  ADD NEW USER (Signup)
export async function addUser(req, res) {
  try {
    const newUser = await userService.add(req.body);
    res.status(201).json(newUser);
  } catch (err) {
    logger.error("Failed to add user", err);
    res.status(500).json({ error: "Failed to add user" });
  }
}

//  DELETE USER
export async function deleteUser(req, res) {
  try {
    await userService.remove(req.params.id);
    res.send({ msg: "Deleted successfully" });
  } catch (err) {
    logger.error("Failed to delete user", err);
    res.status(400).send({ err: "Failed to delete user" });
  }
}

//  UPDATE USER (Profile update)
export async function updateUser(req, res) {
  try {
    const userId = req.params.id; //  Extract user ID from URL
    const userUpdates = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    //  Call service to update user
    const updatedUser = await userService.update(userId, userUpdates);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    logger.error("Failed to update user", err);
    res.status(500).json({ error: "Failed to update user" });
  }
}

//  ADD STAY TO WISHLIST
export async function addToWishlist(req, res) {
  try {
    const { userId, stayId } = req.body;
    const updatedUser = await userService.addToWishlist(userId, stayId);
    res.send(updatedUser);
  } catch (err) {
    logger.error("Failed to add stay to wishlist", err);
    res.status(400).send({ err: "Failed to add stay to wishlist" });
  }
}

//  REMOVE STAY FROM WISHLIST
export async function removeFromWishlist(req, res) {
  try {
    const { userId, stayId } = req.body;
    const updatedUser = await userService.removeFromWishlist(userId, stayId);
    res.send(updatedUser);
  } catch (err) {
    logger.error("Failed to remove stay from wishlist", err);
    res.status(400).send({ err: "Failed to remove stay from wishlist" });
  }
}
