import multer from 'multer';
import { CV_DIR } from './index.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CV_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

export default upload;
