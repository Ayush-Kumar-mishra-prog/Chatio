import express from "express";
import { textMessageController } from "../controller/aiChat.Controller.js";
import { protect } from "../middleware/authMiddleware.js";

const aiRouter = express.Router();

aiRouter.post("/chat", protect, textMessageController);

export default aiRouter;
