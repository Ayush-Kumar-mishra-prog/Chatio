import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    callerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    type: { type: String, enum: ["voice", "video"], required: true },
    status: {
      type: String,
      enum: ["outgoing", "incoming", "missed", "answered", "declined"],
      default: "outgoing",
    },
    duration: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const CallLog = mongoose.models.CallLog || mongoose.model("CallLog", callLogSchema);

export default CallLog;
