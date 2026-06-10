import CallLog from "../models/CallLog.js";
import CallInvite from "../models/CallInvite.js";
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

export const sendCallInvite = async (req, res) => {
  try {
    const {
      callId,
      roomID,
      conversation,
      receiverIds = [],
      type,
      offer,
      caller,
    } = req.body;

    if (!callId || !roomID || !type) {
      return res.status(400).json({ success: false, message: "Missing call details" });
    }

    await CallInvite.findOneAndUpdate(
      { callId },
      {
        callId,
        roomID,
        callerId: req.user._id,
        receiverIds,
        conversation,
        caller: caller || { name: req.user.name, image: req.user.image },
        type,
        offer,
        status: "ringing",
        expiresAt: new Date(Date.now() + 60 * 1000),
      },
      { upsert: true, new: true },
    );

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingCallInvites = async (req, res) => {
  try {
    const userId = req.user._id;
    const invites = await CallInvite.find({
      receiverIds: userId,
      status: "ringing",
      expiresAt: { $gt: new Date() },
    })
      .populate("callerId", "name image")
      .sort({ createdAt: -1 })
      .limit(1);

    const invite = invites[0];
    if (!invite) {
      return res.json({ success: true, invite: null });
    }

    res.json({
      success: true,
      invite: {
        callId: invite.callId,
        roomID: invite.roomID,
        from: asId(invite.callerId?._id || invite.callerId),
        type: invite.type,
        offer: invite.offer,
        conversation: invite.conversation,
        caller: invite.caller || {
          name: invite.callerId?.name,
          image: invite.callerId?.image,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const respondToCallInvite = async (req, res) => {
  try {
    const { callId } = req.params;
    const { action } = req.body;

    const invite = await CallInvite.findOne({ callId });
    if (!invite) {
      return res.status(404).json({ success: false, message: "Call not found" });
    }

    const status =
      action === "decline" ? "declined" : action === "end" ? "ended" : "answered";
    invite.status = status;
    await invite.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
