import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf', // PDF
    'application/msword', // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/rtf', // RTF
  ];

  let filterError = new Error('Invalid file type.');
  filterError.name = 'MulterError';

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(filterError, false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 },
  fileFilter,
});

export default upload;
