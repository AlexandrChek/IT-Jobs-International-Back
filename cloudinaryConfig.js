import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dzy3u2mhd',
  api_key: '397233177835187',
  api_secret: 'xklwC54H3a48hhyiNt8jri7GX2s',
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
