import CallLog from "../models/CallLog.js";
import Conversation from "../models/Conversation.js";

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
