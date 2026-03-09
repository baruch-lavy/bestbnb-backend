import path from "path";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";

import { authRoutes } from "./api/auth/auth.routes.js";
import { userRoutes } from "./api/user/user.routes.js";
import { reportsRoutes } from "./api/reports/reports.routes.js";

import { setupAsyncLocalStorage } from "./middlewares/setupAls.middleware.js";
import { logger } from "./services/logger.service.js";

const app = express();

// Express App Config
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const corsOptions = {
  origin(origin, callback) {
    // Allow Postman, curl, and same-origin requests with no Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve("uploads")));
app.use(setupAsyncLocalStorage);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.resolve("public")));
}

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/reports", reportsRoutes);

// Start Server
const port = process.env.PORT || 3030;
const server = app.listen(port, () => {
  logger.info("Server is running on port: " + port);
  console.log("Server is running at: http://localhost:" + port);
});

//  Serve React App (Handles Frontend Routing)
// app.use(express.static('public'))
// app.get('/**', (req, res) => {
//     res.sendFile(path.resolve('public/index.html'))
// })
