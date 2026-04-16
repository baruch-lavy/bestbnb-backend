import express from 'express'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { getUser, getUsers, deleteUser, updateUser, addUser, addToWishlist, removeFromWishlist } from './user.controller.js'

const router = express.Router()

router.get('/', getUsers)
router.get('/:id', getUser)
router.post('/', addUser) // ✅ Signup (Add User)
router.put('/:id', requireAuth, updateUser)
router.delete('/:id', requireAuth, deleteUser)

// ✅ Wishlist Routes
router.post('/wishlist/add', requireAuth, addToWishlist)
router.post('/wishlist/remove', requireAuth, removeFromWishlist)

export const userRoutes = router
