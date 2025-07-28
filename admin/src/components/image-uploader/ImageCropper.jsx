import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { FiCrop, FiCheck, FiX, FiRotateCw, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { notifyError, notifySuccess } from '@/utils/toast';

// Aspect ratio configurations for different contexts
export const ASPECT_RATIOS = {
  // Banner contexts
  'banner-home-hero': { ratio: 1920 / 400, label: 'Home Hero (1920×400)', width: 1920, height: 400 },
  'banner-home-middle': { ratio: 1200 / 300, label: 'Home Middle (1200×300)', width: 1200, height: 300 },
  'banner-products-hero': { ratio: 1920 / 300, label: 'Products Hero (1920×300)', width: 1920, height: 300 },
  'banner-category-top': { ratio: 1200 / 200, label: 'Category Top (1200×200)', width: 1200, height: 200 },
  'banner-promotions-hero': { ratio: 1920 / 350, label: 'Promotions Hero (1920×350)', width: 1920, height: 350 },
  'banner-page-header': { ratio: 1920 / 250, label: 'Page Header (1920×250)', width: 1920, height: 250 },
  'banner-sidebar-ads': { ratio: 300 / 400, label: 'Sidebar Ads (300×400)', width: 300, height: 400 },
  'banner-footer': { ratio: 1200 / 150, label: 'Footer Banner (1200×150)', width: 1200, height: 150 },
  'banner-side': { ratio: 400 / 300, label: 'Side Banner (400×300)', width: 400, height: 300 },
  
  // Category contexts
  'category-icon': { ratio: 1, label: 'Category Icon (Square)', width: 238, height: 238 },
  'category-header': { ratio: 1200 / 300, label: 'Category Header (1200×300)', width: 1200, height: 300 },
  
  // Product contexts
  'product-main': { ratio: 1, label: 'Product Image (Square)', width: 800, height: 800 },
  
  // Profile & Settings contexts
  'profile-avatar': { ratio: 1, label: 'Profile Picture (Square)', width: 200, height: 200 },
  'favicon': { ratio: 1, label: 'Favicon (Square)', width: 32, height: 32 },
  'meta-image': { ratio: 1200 / 630, label: 'Meta Image (1200×630)', width: 1200, height: 630 },
  'logo': { ratio: 16 / 9, label: 'Logo (16:9)', width: 320, height: 180 },
  
  // Store customization contexts
  'store-hero': { ratio: 1920 / 400, label: 'Store Hero (1920×400)', width: 1920, height: 400 },
  'about-section': { ratio: 16 / 9, label: 'About Section (16:9)', width: 800, height: 450 },
  'feature-image': { ratio: 4 / 3, label: 'Feature Image (4:3)', width: 800, height: 600 },
  
  // Coupon contexts
  'coupon-image': { ratio: 16 / 9, label: 'Coupon Image (16:9)', width: 400, height: 225 },
  
  // Default/fallback
  'default': { ratio: 16 / 9, label: 'Default (16:9)', width: 800, height: 450 }
};

const ImageCropper = ({ 
  imageSrc, 
  onCropComplete, 
  onCancel, 
  aspectRatioType = 'default',
  title = 'Crop Image'
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const aspectRatioConfig = ASPECT_RATIOS[aspectRatioType] || ASPECT_RATIOS.default;

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onRotationChange = useCallback((rotation) => {
    setRotation(rotation);
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getRadianAngle = (degreeValue) => {
    return (degreeValue * Math.PI) / 180;
  };

  const rotateSize = (width, height, rotation) => {
    const rotRad = getRadianAngle(rotation);
    return {
      width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0, flip = { horizontal: false, vertical: false }) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    ctx.drawImage(image, 0, 0);

    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');

    if (!croppedCtx) {
      return null;
    }

    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    croppedCtx.drawImage(
      canvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      croppedCanvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels) {
      notifyError('Please select a crop area');
      return;
    }

    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      
      if (croppedImageBlob) {
        // Create a file from the blob
        const croppedFile = new File([croppedImageBlob], 'cropped-image.jpg', {
          type: 'image/jpeg'
        });
        
        onCropComplete(croppedFile, croppedImageBlob);
        notifySuccess('Image cropped successfully!');
      } else {
        notifyError('Failed to crop image');
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      notifyError('Error processing image');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aspect Ratio: {aspectRatioConfig.label}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 min-h-[400px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatioConfig.ratio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onRotationChange={onRotationChange}
            onCropComplete={onCropCompleteCallback}
            showGrid={true}
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
                backgroundColor: '#f3f4f6'
              },
              mediaStyle: {
                transformOrigin: 'center center'
              }
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Zoom and Rotation Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="Zoom Out"
              >
                <FiZoomOut className="text-gray-500" />
              </button>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <button
                type="button"
                onClick={() => setZoom(Math.min(5, zoom + 0.1))}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="Zoom In"
              >
                <FiZoomIn className="text-gray-500" />
              </button>
              <span className="text-sm text-gray-500 min-w-[3rem]">{zoom.toFixed(1)}x</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setRotation((rotation - 90 + 360) % 360)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="Rotate Left 90°"
              >
                <FiRotateCw className="text-gray-500 transform -scale-x-100" />
              </button>
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <button
                type="button"
                onClick={() => setRotation((rotation + 90) % 360)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="Rotate Right 90°"
              >
                <FiRotateCw className="text-gray-500" />
              </button>
              <span className="text-sm text-gray-500 min-w-[3rem]">{rotation}°</span>
            </div>

            <div className="flex items-center justify-center space-x-2">
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setZoom(0.5)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                  title="Zoom to 50%"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                  title="Zoom to 100%"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(2)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                  title="Zoom to 200%"
                >
                  200%
                </button>
              </div>
              <button
                onClick={resetCrop}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCropConfirm}
              disabled={isProcessing}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{t("Processing")}</span>
                </>
              ) : (
                <>
                  <FiCheck size={16} />
                  <span>Apply Crop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper; 