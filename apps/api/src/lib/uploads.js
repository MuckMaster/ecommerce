import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads", "products");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const random = crypto.randomBytes(8).toString("hex");
        const ext = path.extname(file.originalname);
        cb(null, `${random}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only images are allowed (jpeg, png, webp)"), false);
    }
};

export const uploadImage = multer ({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 *1024 },
});