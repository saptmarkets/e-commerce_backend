const { cloudinary } = require('../config/cloudinary');

/**
 * Upload a single image to Cloudinary (with overwrite + invalidate)
 *
 * Expected multipart/form-data:
 *   - image      : File (required)
 *   - public_id  : String (optional) → if provided, the existing image will be overwritten
 */
const uploadImage = async (req, res) => {
  try {
    // Multer attaches the processed file to req.file
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const publicId = req.body.public_id || undefined;
    const folder = req.body.folder || "uploads";

    // Make public_id unique by adding timestamp if not provided or if it's a generic name
    let uniquePublicId = publicId;
    if (!publicId || publicId.includes('cropped-image') || publicId.includes('image')) {
      uniquePublicId = `${publicId || 'image'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Upload using an upload_stream so we can work directly with the in-memory buffer
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: uniquePublicId,
          folder: folder,
          overwrite: false, // Changed to false to prevent overwriting
          invalidate: true, // ← ensures Cloudinary purges CDN cached versions
        },
        (error, uploaded) => {
          if (error) return reject(error);
          return resolve(uploaded);
        }
      );

      stream.end(req.file.buffer);
    });

    return res.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
      version: result.version,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ message: 'Image upload failed', error: error.message });
  }
};

module.exports = { uploadImage }; 