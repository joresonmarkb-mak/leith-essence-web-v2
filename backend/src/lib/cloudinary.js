import { v2 as cloudinary } from "cloudinary";

export const cloudinaryReady = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// Sends one image buffer to Cloudinary. Big photos are shrunk to 1600px so pages load fast.
export function uploadImage(buffer, folder) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [{ width: 1600, height: 1600, crop: "limit" }, { quality: "auto" }],
        },
        (err, result) => (err ? reject(err) : resolve(result))
      )
      .end(buffer);
  });
}

// True only for images that were uploaded to YOUR Cloudinary account
export const isOwnUpload = (url) =>
  typeof url === "string" && url.startsWith(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`);