import { Router } from "express";
import multer from "multer";
import { storagePut } from "./storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const uploadMediaRouter = Router();

uploadMediaRouter.post(
  "/api/upload-question-media",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const ext = req.file.originalname.split(".").pop() ?? "jpg";
      const suffix = Math.random().toString(36).slice(2, 9);
      const key = `question-media/${Date.now()}-${suffix}.${ext}`;

      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      res.json({ url });
    } catch (err) {
      console.error("[upload-question-media]", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

export default uploadMediaRouter;
