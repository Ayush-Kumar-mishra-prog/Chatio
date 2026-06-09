import express from "express";
import { createCallLog, getCallLogs } from "../controller/callController.js";
import { protect } from "../middleware/authMiddleware.js";

const callRouter = express.Router();

callRouter.get("/", protect, getCallLogs);
callRouter.post("/", protect, createCallLog);

export default callRouter;
