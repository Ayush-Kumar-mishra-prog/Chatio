import Status from "../models/Status.js";
import Conversation from "../models/Conversation.js";
import { uploadIfNeeded } from "../utils/uploadImage.js";
import { io, userSocketMap } from "../server.js";

const asId = (value) => value?.toString?.() ?? "";

const getVisibleUserIds = async (userId) => {
  const conversations = await Conversation.find({ members: userId }).select("members");
  const visibleUserIds = new Set([asId(userId)]);
  conversations.forEach((conversation) => {
    conversation.members.forEach((memberId) => visibleUserIds.add(asId(memberId)));
  });
  return visibleUserIds;
};

const emitToUsers = (userIds, eventName, payload, exceptUserId) => {
  userIds.forEach((id) => {
    if (exceptUserId && id === asId(exceptUserId)) return;
    const socketId = userSocketMap[id];
    if (socketId) io.to(socketId).emit(eventName, payload);
  });
};

export const getStatuses = async (req, res) => {
  try {
    const userId = req.user._id;
    const visibleUserIds = await getVisibleUserIds(userId);

    const statuses = await Status.find({
      userId: { $in: [...visibleUserIds] },
      expiresAt: { $gt: new Date() },
    })
      .populate("userId", "name image")
      .populate("viewers", "name image")
      .sort({ createdAt: 1 });

    res.json({ success: true, statuses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStatus = async (req, res) => {
  try {
    const { type = "text", text = "", image = "", background = "#075e54" } = req.body;
    if (type === "image" && !image) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }
    if (type === "text" && !text.trim()) {
      return res.status(400).json({ success: false, message: "Status text is required" });
    }

    const imageUrl = image ? await uploadIfNeeded(image, "chatio/status") : "";
    const status = await Status.create({
      userId: req.user._id,
      type,
      text: text.trim(),
      image: imageUrl,
      background,
    });
    await status.populate("userId", "name image");
    await status.populate("viewers", "name image");

    const visibleUserIds = await getVisibleUserIds(req.user._id);
    emitToUsers([...visibleUserIds], "status:new", status, req.user._id);

    res.status(201).json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markStatusViewed = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id).populate("userId", "name image");
    if (!status || status.expiresAt <= new Date()) {
      return res.status(404).json({ success: false, message: "Status not found" });
    }

    const viewerId = asId(req.user._id);
    const ownerId = asId(status.userId?._id || status.userId);

    if (viewerId !== ownerId) {
      await Status.findByIdAndUpdate(status._id, {
        $addToSet: { viewers: req.user._id },
      });
    }

    const updated = await Status.findById(status._id)
      .populate("userId", "name image")
      .populate("viewers", "name image");

    if (viewerId !== ownerId) {
      const visibleUserIds = await getVisibleUserIds(ownerId);
      emitToUsers([...visibleUserIds], "status:viewed", updated);
    }

    res.json({ success: true, status: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
