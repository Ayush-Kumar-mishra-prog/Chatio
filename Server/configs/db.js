import mongoose from "mongoose";

 const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected");
    });
    const mongoUri = process.env.MONGODB_URI?.trim().replace(/\/+$/, "");

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(mongoUri, {
      dbName: "Chatio",
    });
  } catch (e) {
    console.error("Error connecting to MongoDB:", e);
  }
};

export default connectDB
