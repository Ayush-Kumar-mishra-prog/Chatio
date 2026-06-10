import mongoose from "mongoose";

const callInviteSchema = new mongoose.Schema(
  {
    callId: { type: String, required: true, unique: true },
    roomID: { type: String, required: true },
    callerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    conversation: { type: mongoose.Schema.Types.Mixed, default: {} },
    caller: { type: mongoose.Schema.Types.Mixed, default: {} },
    type: { type: String, enum: ["voice", "video"], required: true },
    status: {
      type: String,
      enum: ["ringing", "answered", "declined", "ended", "missed"],
      default: "ringing",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 1000),
    },
  },
  { timestamps: true },
);

callInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
callInviteSchema.index({ receiverIds: 1, status: 1 });

const CallInvite =
  mongoose.models.CallInvite || mongoose.model("CallInvite", callInviteSchema);

export default CallInvite;
