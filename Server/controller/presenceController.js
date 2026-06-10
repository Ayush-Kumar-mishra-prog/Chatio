import GUser from "../models/google.model.js";

const asId = (value) => value?.toString?.() ?? "";
const ONLINE_THRESHOLD_MS = 60 * 1000;

export const heartbeat = async (req, res) => {
  try {
    await GUser.findByIdAndUpdate(req.user._id, { lastSeen: new Date() });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOnlineUsers = async (req, res) => {
  try {
    const ids = (req.query.ids || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const threshold = new Date(Date.now() - ONLINE_THRESHOLD_MS);
    const query = { lastSeen: { $gte: threshold } };

    if (ids.length) {
      query._id = { $in: ids };
    } else {
      query._id = { $ne: req.user._id };
    }

    const users = await GUser.find(query).select("_id lastSeen");
    res.json({
      success: true,
      onlineUserIds: users.map((user) => asId(user._id)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
