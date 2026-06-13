import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ACCESS_EXPIRY =
  process.env.JWT_ACCESS_TIMEOUT?.trim() ||
  process.env.JWT_TIMEOUT?.trim() ||
  "15m";

const REFRESH_DAYS = Number(process.env.JWT_REFRESH_DAYS) || 30;

export const createAccessToken = (user) => {
  const expiresIn =
    ACCESS_EXPIRY === "7day" ? "7d" : ACCESS_EXPIRY;

  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      type: "access",
    },
    process.env.JWT_SECRET,
    { expiresIn },
  );
};

export const createToken = createAccessToken;

export const createRefreshTokenValue = (userId) => {
  const randomPart = crypto.randomBytes(48).toString("hex");
  return `${userId}.${randomPart}`;
};

export const parseRefreshToken = (refreshToken = "") => {
  const dotIndex = refreshToken.indexOf(".");
  if (dotIndex <= 0) return null;

  return {
    userId: refreshToken.slice(0, dotIndex),
    secret: refreshToken.slice(dotIndex + 1),
  };
};

export const getRefreshTokenExpiry = () =>
  new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);

export const saveRefreshToken = async (user, refreshToken) => {
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  user.refreshTokenExpires = getRefreshTokenExpiry();
  await user.save();
};

export const issueAuthTokens = async (user) => {
  const token = createAccessToken(user);
  const refreshToken = createRefreshTokenValue(user._id.toString());
  await saveRefreshToken(user, refreshToken);
  return { token, refreshToken };
};

export const clearRefreshToken = async (user) => {
  user.refreshTokenHash = undefined;
  user.refreshTokenExpires = undefined;
  await user.save();
};

export const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  image: user.image,
  bio: user.bio,
  googleId: user.googleId,
  facebookId: user.facebookId,
  authProvider: user.authProvider,
  isEmailVerified: user.isEmailVerified,
});

export const createVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
