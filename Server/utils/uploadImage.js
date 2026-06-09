import cloudinary from "../configs/cloudniary.js";

export const isDataImage = (value = "") =>
  typeof value === "string" && value.startsWith("data:image/");

export const uploadImage = async (image, folder) => {
  if (!image) return "";
  const response = await cloudinary.uploader.upload(image, {
    folder,
    resource_type: "image",
  });
  return response.secure_url;
};

export const uploadIfNeeded = async (image, folder) => {
  if (!image) return "";
  if (image.includes("res.cloudinary.com")) return image;
  if (isDataImage(image) || /^https?:\/\//.test(image)) {
    return uploadImage(image, folder);
  }
  return image;
};
