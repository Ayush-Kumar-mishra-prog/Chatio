import express from "express";
import { createCallLog, getCallLogs, getZegoToken } from "../controller/callController.js";
import { protect } from "../middleware/authMiddleware.js";

const callRouter = express.Router();

callRouter.get("/", protect, getCallLogs);
callRouter.get("/zego-token", protect, getZegoToken);
callRouter.post("/", protect, createCallLog);

export default callRouter;
