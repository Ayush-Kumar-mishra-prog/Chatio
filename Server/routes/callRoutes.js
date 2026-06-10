import express from "express";
import {
  createCallLog,
  getCallLogs,
  getPendingCallInvites,
  getZegoToken,
  respondToCallInvite,
  sendCallInvite,
} from "../controller/callController.js";
import { protect } from "../middleware/authMiddleware.js";

const callRouter = express.Router();

callRouter.get("/", protect, getCallLogs);
callRouter.get("/zego-token", protect, getZegoToken);
callRouter.get("/pending", protect, getPendingCallInvites);
callRouter.post("/invite", protect, sendCallInvite);
callRouter.put("/invite/:callId/respond", protect, respondToCallInvite);
callRouter.post("/", protect, createCallLog);

export default callRouter;
