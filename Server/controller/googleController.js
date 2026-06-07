import { oauth2client } from "../configs/googleConfig.js";
import { google } from "googleapis";
import GUser from "../models/google.model.js";
import { createToken, publicUser } from "../utils/auth.js";

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

    let user = await GUser.findOne({ email });
    if (!user) {
      user = await GUser.create({
        name,
        email,
        image: picture,
        googleId: id,
        authProvider: "google",
        isEmailVerified: true,
      });
    } else {
      user.googleId = user.googleId || id;
      user.image = user.image || picture;
      user.authProvider = user.authProvider === "local" ? "local" : "google";
      user.isEmailVerified = true;
      await user.save();
    }

    const token = createToken(user);

    return res.status(200).json({ message: "success", token, user: publicUser(user) });
  } catch (error) {
    console.error("Error fetching Google access token:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch Google access token" });
  }
};

export default googleLogin;
