import bcrypt from "bcryptjs";
import axios from "axios";
import GUser from "../models/google.model.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  clearRefreshToken,
  issueAuthTokens,
  parseRefreshToken,
  publicUser,
} from "../utils/auth.js";
import { uploadIfNeeded } from "../utils/uploadImage.js";

const normalizeEmail = (email = "") => email.trim().toLowerCase();

export const signup = async (req, res) => {
  try {
    const { name, email, password, bio = "", image = "" } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name?.trim() || !normalizedEmail || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const existingUser = await GUser.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await GUser.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      bio,
      image,
      authProvider: "local",
    });
    const { token, refreshToken } = await issueAuthTokens(user);

    return res.status(201).json({
      message: "Signup successful",
      token,
      refreshToken,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Signup failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await GUser.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }


    const { token, refreshToken } = await issueAuthTokens(user);
    return res.json({
      message: "Login successful",
      token,
      refreshToken,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed" });
  }
};

export const facebookLogin = async (req, res) => {
  try {
    const { accessToken, facebookId, name, email, image } = req.body;
    let profile = {
      id: facebookId,
      name,
      email,
      picture: { data: { url: image } },
    };

    if (accessToken) {
      const { data } = await axios.get("https://graph.facebook.com/me", {
        params: {
          fields: "id,name,email,picture.type(large)",
          access_token: accessToken,
        },
      });
      profile = data;
    }

    const normalizedEmail = normalizeEmail(profile.email);
    if (!profile.id || !normalizedEmail) {
      return res
        .status(400)
        .json({ message: "Facebook account must include email" });
    }

    const profileImage = profile.picture?.data?.url || image || "";
    const cloudinaryPicture = profileImage ? await uploadIfNeeded(profileImage, "chatio/profiles") : "";
    let user = await GUser.findOne({
      $or: [{ facebookId: profile.id }, { email: normalizedEmail }],
    });

    if (!user) {
      user = await GUser.create({
        name: profile.name,
        email: normalizedEmail,
        image: cloudinaryPicture,
        facebookId: profile.id,
        authProvider: "facebook",
      });
    } else {
      user.facebookId = user.facebookId || profile.id;
      user.image = user.image || cloudinaryPicture;
      user.authProvider = "facebook";
      await user.save();
    }

    const { token, refreshToken } = await issueAuthTokens(user);
    return res.json({
      message: "Login successful",
      token,
      refreshToken,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Facebook login error:", error);
    const message =
      error.response?.data?.message || error.message || "Facebook login failed";
    return res.status(500).json({ message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: incomingRefreshToken } = req.body;

    if (!incomingRefreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const parsed = parseRefreshToken(incomingRefreshToken);
    if (!parsed?.userId || !parsed.secret) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await GUser.findById(parsed.userId).select(
      "+refreshTokenHash +refreshTokenExpires",
    );

    if (
      !user ||
      !user.refreshTokenHash ||
      !user.refreshTokenExpires ||
      user.refreshTokenExpires < new Date()
    ) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const tokenMatches = await bcrypt.compare(parsed.secret, user.refreshTokenHash);
    if (!tokenMatches) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const tokens = await issueAuthTokens(user);
    return res.json({
      message: "Token refreshed",
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({ message: "Token refresh failed" });
  }
};

export const logout = async (req, res) => {
  try {
    await clearRefreshToken(req.user);
    return res.json({ message: "Logged out" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Logout failed" });
  }
};

export const getMe = async (req, res) => {
  return res.json({ user: publicUser(req.user) });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, bio, image } = req.body;

    if (name !== undefined) req.user.name = name.trim();
    if (bio !== undefined) req.user.bio = bio;
    if (image !== undefined) req.user.image = await uploadIfNeeded(image, "chatio/profiles");

    await req.user.save();

    return res.json({ message: "Profile updated", user: publicUser(req.user) });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Profile update failed" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ members: userId });
    const conversationIds = conversations.map((conversation) => conversation._id);

    await Message.deleteMany({
      $or: [{ senderId: userId }, { conversationId: { $in: conversationIds } }],
    });
    await Conversation.deleteMany({ _id: { $in: conversationIds } });
    await clearRefreshToken(req.user);
    await GUser.deleteOne({ _id: userId });

    return res.json({ message: "Account deleted" });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ message: "Account delete failed" });
  }
};
