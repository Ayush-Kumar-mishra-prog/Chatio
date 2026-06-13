import GUser from "../models/google.model.js";

export const isVerificationExpired = (user) =>
  !user?.emailVerificationExpires ||
  user.emailVerificationExpires < new Date();

export const removeUnverifiedLocalUser = async (user) => {
  if (!user?._id || user.isEmailVerified || user.authProvider !== "local") {
    return false;
  }

  await GUser.deleteOne({ _id: user._id });
  return true;
};

export const cleanupExpiredUnverifiedUsers = async () => {
  const result = await GUser.deleteMany({
    isEmailVerified: false,
    authProvider: "local",
    $or: [
      { emailVerificationExpires: { $lt: new Date() } },
      { emailVerificationExpires: { $exists: false } },
    ],
  });

  return result.deletedCount;
};
