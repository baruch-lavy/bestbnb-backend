import express from 'express'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { getUser, getUsers, deleteUser, updateUser, addUser, addToWishlist, removeFromWishlist, getWishlist } from './user.controller.js'

const router = express.Router()

router.get('/', getUsers)
// ✅ Wishlist Routes (must be before /:id to avoid param collision)
router.get('/wishlist/mine', requireAuth, getWishlist)
router.post('/wishlist/add', requireAuth, addToWishlist)
router.post('/wishlist/remove', requireAuth, removeFromWishlist)
router.get('/:id', getUser)
router.post('/', addUser)
router.put('/:id', requireAuth, updateUser)
router.delete('/:id', requireAuth, deleteUser)

export const userRoutes = router
