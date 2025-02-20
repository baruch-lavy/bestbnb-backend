import { logger } from '../../services/logger.service.js'
import { socketService } from '../../services/socket.service.js'
import { userService } from '../user/user.service.js'
import { authService } from '../auth/auth.service.js'
import { reviewService } from './review.service.js'

export async function getReviews(req, res) {
    try {
        console.log("🔍 Incoming request for reviews:", req.query) // Debugging
        const reviews = await reviewService.query(req.query)
        res.json(reviews)
    } catch (err) {
        logger.error('❌ Failed to get reviews', err)
        res.status(400).send({ error: 'Failed to get reviews' })
    }
}

export async function deleteReview(req, res) {
    const { loggedinUser } = req
    if (!loggedinUser) return res.status(401).send({ error: "Unauthorized" })

    const { id: reviewId } = req.params

    try {
        const deletedCount = await reviewService.remove(reviewId, loggedinUser)
        if (deletedCount === 1) {
            socketService.broadcast({ type: 'review-removed', data: reviewId, userId: loggedinUser._id })
            res.send({ message: 'Deleted successfully' })
        } else {
            res.status(400).send({ error: 'Cannot remove review' })
        }
    } catch (err) {
        logger.error('❌ Failed to delete review', err)
        res.status(400).send({ error: 'Failed to delete review' })
    }
}

export async function addReview(req, res) {
    const { loggedinUser } = req
    if (!loggedinUser) return res.status(401).send({ error: "Unauthorized" })

    try {
        let review = req.body
        review.byUserId = loggedinUser._id

        review = await reviewService.add(review)

        // Increase user score for adding a review
        loggedinUser.score += 10
        await userService.update(loggedinUser)

        // Update user token
        const loginToken = authService.getLoginToken(loggedinUser)
        res.cookie('loginToken', loginToken)

        // Attach user details
        review.byUser = loggedinUser
        review.aboutUser = await userService.getById(review.aboutUserId)

        delete review.aboutUser.givenReviews
        delete review.aboutUserId
        delete review.byUserId

        // Notify users via sockets
        socketService.broadcast({ type: 'review-added', data: review, userId: loggedinUser._id })
        socketService.emitToUser({ type: 'review-about-you', data: review, userId: review.aboutUser._id })

        const fullUser = await userService.getById(loggedinUser._id)
        socketService.emitTo({ type: 'user-updated', data: fullUser, label: fullUser._id })

        res.json(review)
    } catch (err) {
        logger.error('❌ Failed to add review', err)
        res.status(400).send({ error: 'Failed to add review' })
    }
}
