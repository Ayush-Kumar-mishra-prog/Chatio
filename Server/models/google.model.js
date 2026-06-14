import mongoose from "mongoose";

const gSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: "",
      select: false,
      validate: {
        validator: (value) => !value || value.length >= 8,
        message: "Password must be at least 8 characters",
      },
    },
    image: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
    },
    googleId: {
      type: String,
      default: "",
      index: true,
    },
    facebookId: {
      type: String,
      default: "",
      index: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    refreshTokenExpires: {
      type: Date,
      select: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// export default mongoose.model("GoogleUser", gSchema);

const GUser = mongoose.models.User || mongoose.model("User", gSchema);

export default GUser;
