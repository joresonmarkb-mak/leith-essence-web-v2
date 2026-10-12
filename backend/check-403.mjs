import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;

const timestamp = Math.floor(Date.now() / 1000);
const folder = "leith-essence/test";
const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, secret);

const form = new FormData();
form.append(
  "file",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
);
form.append("api_key", key);
form.append("timestamp", String(timestamp));
form.append("folder", folder);
form.append("signature", signature);

const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
console.log("status:", res.status);
console.log("content-type:", res.headers.get("content-type"));
console.log("server:", res.headers.get("server"));
console.log("body:", (await res.text()).slice(0, 600));