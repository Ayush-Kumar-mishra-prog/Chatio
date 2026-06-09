import Status from "../models/Status.js";
import Conversation from "../models/Conversation.js";
import { uploadIfNeeded } from "../utils/uploadImage.js";

export const getStatuses = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ members: userId }).select("members");
    const visibleUserIds = new Set([userId.toString()]);
    conversations.forEach((conversation) => {
      conversation.members.forEach((memberId) => visibleUserIds.add(memberId.toString()));
    });

    const statuses = await Status.find({
      userId: { $in: [...visibleUserIds] },
      expiresAt: { $gt: new Date() },
    })
      .populate("userId", "name image")
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
    res.status(201).json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markStatusViewed = async (req, res) => {
  try {
    await Status.findByIdAndUpdate(req.params.id, {
      $addToSet: { viewers: req.user._id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
