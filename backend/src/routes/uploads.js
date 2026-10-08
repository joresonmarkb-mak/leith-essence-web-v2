import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { uploadImage, cloudinaryReady } from "../lib/cloudinary.js";

const router = Router();

const TYPES = {
  receipt: { folder: "leith-essence/receipts", adminOnly: false }, // GCash proof from buyers
  expense: { folder: "leith-essence/expenses", adminOnly: true },  // batch expense / cashflow receipts
  perfume: { folder: "leith-essence/perfumes", adminOnly: true },
  note: { folder: "leith-essence/notes", adminOnly: true },
};
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.has(file.mimetype)
      ? cb(null, true)
      : cb(Object.assign(new Error("Upload a JPG, PNG, or WEBP image."), { status: 400 })),
});

// POST /api/uploads?type=receipt   (form-data, field name: file)
router.post("/", requireAuth, (req, res) => {
  const config = TYPES[req.query.type];
  if (!config) return res.status(400).json({ error: "type must be receipt, expense, perfume, or note." });
  if (config.adminOnly && req.user.role !== "admin")
    return res.status(403).json({ error: "Only admins can upload that." });
  if (!cloudinaryReady())
    return res.status(503).json({ error: "Image uploads aren't set up yet. Try again later." });

  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "That image is over 5 MB." });
      if (err.status === 400 || err instanceof multer.MulterError)
        return res.status(400).json({ error: err.status ? err.message : "Upload one image in the 'file' field." });
      console.error(err);
      return res.status(500).json({ error: "Something went wrong. Try again." });
    }
    if (!req.file) return res.status(400).json({ error: "Choose an image to upload." });
    try {
      const result = await uploadImage(req.file.buffer, config.folder);
      res.status(201).json({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      });
    } catch (e) {
      if (e?.http_code === 400) return res.status(400).json({ error: "That file isn't a valid image." });
      console.error(e);
      res.status(500).json({ error: "Upload failed. Try again." });
    }
  });
});

export default router;