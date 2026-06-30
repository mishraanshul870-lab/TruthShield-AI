import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Storage engine config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter based on type
const fileFilter = (req, file, cb) => {
  const allowedExtensions = {
    pdf: ['.pdf'],
    image: ['.png', '.jpg', '.jpeg', '.webp'],
    video: ['.mp4', '.mkv', '.avi', '.mov', '.webm']
  };

  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'pdf' && allowedExtensions.pdf.includes(ext)) {
    cb(null, true);
  } else if (file.fieldname === 'image' && allowedExtensions.image.includes(ext)) {
    cb(null, true);
  } else if (file.fieldname === 'video' && allowedExtensions.video.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for field ${file.fieldname}. Allowed types: ${JSON.stringify(allowedExtensions[file.fieldname] || allowedExtensions)}`), false);
  }
};

// Multer instances for different routes
export const uploadPdf = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('pdf');

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
}).single('image');

export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
}).single('video');
