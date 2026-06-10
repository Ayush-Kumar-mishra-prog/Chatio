import CallLog from "../models/CallLog.js";
import Conversation from "../models/Conversation.js";
import { generateToken04 } from "../utils/zegoServerAssistant.js";

const asId = (value) => value?.toString();

export const getCallLogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const calls = await CallLog.find({
      $or: [{ callerId: userId }, { receiverIds: userId }],
    })
      .populate("callerId", "name image")
      .populate("receiverIds", "name image")
      .populate({
        path: "conversationId",
        populate: { path: "members", select: "name image" },
      })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, calls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCallLog = async (req, res) => {
  try {
    const { conversationId, type, status = "outgoing", duration = 0 } = req.body;
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: req.user._id,
    });
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    const receiverIds = conversation.members.filter((memberId) => asId(memberId) !== asId(req.user._id));
    const call = await CallLog.create({
      conversationId,
      callerId: req.user._id,
      receiverIds,
      type,
      status,
      duration,
    });
    res.status(201).json({ success: true, call });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getZegoToken = async (req, res) => {
  try {
    const appID = Number(process.env.ZEGO_APP_ID);
    const serverSecret = process.env.ZEGO_SERVER_SECRET;
    const { roomID } = req.query;

    if (!appID || !serverSecret) {
      return res.status(500).json({
        success: false,
        message: "ZegoCloud is not configured. Add ZEGO_APP_ID and ZEGO_SERVER_SECRET to .env",
      });
    }

    if (!roomID) {
      return res.status(400).json({ success: false, message: "roomID is required" });
    }

    const userId = asId(req.user._id);
    const token = generateToken04(appID, userId, serverSecret, 3600, "");

    res.json({ success: true, appID, token, roomID, userId });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.errorMessage || error.message || "Failed to generate Zego token",
    });
  }
};
