import { v2 as cloudinary } from 'cloudinary';

export const setCloudConfig = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
  });
};

export const cloudinaryUpload = (req, res, next) => {
  if (!req.file) return next();

  let originalNameArr = req.file.originalname.split('.');
  const { seekerId, jobId } = req.body;
  const extension = originalNameArr.pop().toLowerCase();
  const fileName = originalNameArr.join('_').replace(/[^a-zA-Z0-9\-_]/g, '_');
  const publicId = `${seekerId}_${jobId}_${fileName}.${extension}`;

  cloudinary.uploader
    .upload_stream(
      { resource_type: 'raw', folder: 'it-jobs-int-back/CVs', public_id: publicId },
      (error, result) => {
        if (error) return next(error);
        req.file.cloudinaryUrl = result.secure_url;
        next();
      },
    )
    .end(req.file.buffer);
};

export const deleteCvsByPrefix = async publicIdStart => {
  const prefix = `it-jobs-int-back/CVs/${publicIdStart}_`;

  const result = await cloudinary.api.delete_resources_by_prefix(prefix, { resource_type: 'raw' });

  console.log(result);
};

export default cloudinary;
