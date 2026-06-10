import express from "express";
import { getOnlineUsers, heartbeat } from "../controller/presenceController.js";
import { protect } from "../middleware/authMiddleware.js";

const presenceRouter = express.Router();

presenceRouter.post("/heartbeat", protect, heartbeat);
presenceRouter.get("/online", protect, getOnlineUsers);

export default presenceRouter;
