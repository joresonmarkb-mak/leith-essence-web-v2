import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const tiny =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const tests = [
  ["WITH resize setting (what the app does)", {
    folder: "leith-essence/test",
    transformation: [{ width: 1600, height: 1600, crop: "limit" }, { quality: "auto" }],
  }],
  ["WITHOUT resize setting", { folder: "leith-essence/test" }],
];

for (const [label, options] of tests) {
  try {
    const r = await cloudinary.uploader.upload(tiny, options);
    console.log("OK    ", label, r.secure_url);
  } catch (e) {
    console.log("FAILED", label, "-", e.message ?? e.error?.message);
  }
}