import express from "express";
import { requireAuth } from "../../middlewares/requireAuth.middleware.js";
import { log } from "../../middlewares/logger.middleware.js";
import { addReview, getReviews, deleteReview } from "./review.controller.js";

const router = express.Router();

router.get("/", log, getReviews); //  Public Route
router.post("/", log, requireAuth, addReview); //  Requires Login
router.delete("/:id", requireAuth, deleteReview); //  Requires Login

export const reviewRoutes = router;
