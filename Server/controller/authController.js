import bcrypt from "bcryptjs";
import axios from "axios";
import GUser from "../models/google.model.js";
import {
  createToken,
  createVerificationCode,
  publicUser,
} from "../utils/auth.js";
import { sendVerificationEmail } from "../services/emailService.js";

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

    const existingUser = await GUser.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const verificationCode = createVerificationCode();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await GUser.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      bio,
      image,
      authProvider: "local",
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendVerificationEmail({
      to: normalizedEmail,
      code: verificationCode,
    });

    return res.status(201).json({
      message: "Verification code sent to your email",
      email: user.email,
      needsVerification: true,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Signup failed" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await GUser.findOne({ email: normalizedEmail }).select(
      "+emailVerificationCode +emailVerificationExpires",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      const token = createToken(user);
      return res.json({
        message: "Email already verified",
        token,
        user: publicUser(user),
      });
    }

    const isExpired =
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date();

    if (isExpired || user.emailVerificationCode !== code?.trim()) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const token = createToken(user);
    return res.json({
      message: "Email verified",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({ message: "Verification failed" });
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

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
        needsVerification: true,
        email: user.email,
      });
    }

    const token = createToken(user);
    return res.json({
      message: "Login successful",
      token,
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

    let user = await GUser.findOne({
      $or: [{ facebookId: profile.id }, { email: normalizedEmail }],
    });

    if (!user) {
      user = await GUser.create({
        name: profile.name,
        email: normalizedEmail,
        image: profile.picture?.data?.url || image || "",
        facebookId: profile.id,
        authProvider: "facebook",
        isEmailVerified: true,
      });
    } else {
      user.facebookId = user.facebookId || profile.id;
      user.image = user.image || profile.picture?.data?.url || image || "";
      user.authProvider = "facebook";
      user.isEmailVerified = true;
      await user.save();
    }

    const token = createToken(user);
    return res.json({
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Facebook login error:", error);
    const message =
      error.response?.data?.message || error.message || "Facebook login failed";
    return res.status(500).json({ message });
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
    if (image !== undefined) req.user.image = image;

    await req.user.save();

    return res.json({ message: "Profile updated", user: publicUser(req.user) });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Profile update failed" });
  }
};
