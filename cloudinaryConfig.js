import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export const cloudinaryUpload = (req, res, next) => {
  if (!req.file) return next();

  cloudinary.uploader
    .upload_stream({ resource_type: 'raw', folder: 'it-jobs-int-back/CVs' }, (error, result) => {
      if (error) return next(error);
      req.file.cloudinaryUrl = result.secure_url;
      next();
    })
    .end(req.file.buffer);
};

export default cloudinary;
