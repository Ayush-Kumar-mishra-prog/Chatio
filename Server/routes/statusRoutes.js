import express from "express";
import { createStatus, getStatuses, markStatusViewed } from "../controller/statusController.js";
import { protect } from "../middleware/authMiddleware.js";

const statusRouter = express.Router();

statusRouter.get("/", protect, getStatuses);
statusRouter.post("/", protect, createStatus);
statusRouter.put("/:id/view", protect, markStatusViewed);

export default statusRouter;
