import jwt from "jsonwebtoken";

export const createToken = (user) => {
  const rawExpiry = process.env.JWT_TIMEOUT?.trim() || "7d";
  const expiresIn = rawExpiry === "7day" ? "7d" : rawExpiry;

  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn },
  );
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
