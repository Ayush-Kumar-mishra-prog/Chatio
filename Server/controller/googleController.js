import { oauth2client } from "../configs/googleConfig.js";
import { google } from "googleapis";
import GUser from "../models/google.model.js";
import { issueAuthTokens, publicUser } from "../utils/auth.js";
import { uploadIfNeeded } from "../utils/uploadImage.js";

const googleLogin = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res
        .status(400)
        .json({ error: "Missing Google authorization code" });
    }

    const googleRes = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleRes.tokens);

    const oauth2 = google.oauth2({ auth: oauth2client, version: "v2" });
    const userRes = await oauth2.userinfo.get();
    const { id, email, name, picture } = userRes.data;

    const cloudinaryPicture = picture ? await uploadIfNeeded(picture, "chatio/profiles") : "";
    let user = await GUser.findOne({ email });
    if (!user) {
      user = await GUser.create({
        name,
        email,
        image: cloudinaryPicture,
        googleId: id,
        authProvider: "google",
      });
    } else {
      user.googleId = user.googleId || id;
      user.image = user.image || cloudinaryPicture;
      user.authProvider = "google";
      await user.save();
    }

    const { token, refreshToken } = await issueAuthTokens(user);

    return res.status(200).json({
      message: "success",
      token,
      refreshToken,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Error fetching Google access token:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch Google access token" });
  }
};

export default googleLogin;
