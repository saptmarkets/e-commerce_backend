import React, { useState } from 'react';
import UploaderWithCropper from './UploaderWithCropper';
import { ASPECT_RATIOS } from './ImageCropper';
import { getContextDisplayName } from '@/utils/cropperHelpers';

const CropperDemo = () => {
  const [selectedContext, setSelectedContext] = useState('banner-home-hero');
  const [imageUrl, setImageUrl] = useState('');

  const contextGroups = {
    'Banner Contexts': [
      'banner-home-hero',
      'banner-home-middle',
      'banner-products-hero',
      'banner-category-top',
      'banner-promotions-hero',
      'banner-page-header',
      'banner-sidebar-ads',
      'banner-footer',
      'banner-side'
    ],
    'Category Contexts': [
      'category-icon',
      'category-header'
    ],
    'Product Contexts': [
      'product-main'
    ],
    'Profile & Settings': [
      'profile-avatar',
      'favicon',
      'meta-image',
      'logo'
    ],
    'Store Customization': [
      'store-hero',
      'about-section',
      'feature-image'
    ],
    'Other Contexts': [
      'coupon-image',
      'default'
    ]
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Image Cropper System Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test the Facebook-like image cropping system with different aspect ratios for various contexts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Context Selector */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Select Context</h2>
            
            {Object.entries(contextGroups).map(([groupName, contexts]) => (
              <div key={groupName} className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  {groupName}
                </h3>
                <div className="space-y-1">
                  {contexts.map((context) => {
                    const config = ASPECT_RATIOS[context];
                    const isSelected = selectedContext === context;
                    
                    return (
                      <button
                        key={context}
                        onClick={() => setSelectedContext(context)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">
                          {getContextDisplayName(context)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {config?.label || 'Default (16:9)'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Context Info & Uploader */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Context</h2>
            
            {(() => {
              const config = ASPECT_RATIOS[selectedContext];
              return (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Context Type</label>
                    <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      {getContextDisplayName(selectedContext)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Aspect Ratio</label>
                    <p className="text-lg font-semibold">
                      {config?.label || 'Default (16:9)'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dimensions</label>
                    <p className="text-lg">
                      {config?.width || 800} × {config?.height || 450}px
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ratio Value</label>
                    <p className="text-lg">
                      {config?.ratio ? config.ratio.toFixed(2) : '1.78'}:1
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Visual Representation */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Canvas Preview
              </label>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                {(() => {
                  const config = ASPECT_RATIOS[selectedContext];
                  const ratio = config?.ratio || 16/9;
                  const maxWidth = 400;
                  const width = Math.min(maxWidth, 400);
                  const height = width / ratio;
                  
                  return (
                    <div
                      className="bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-semibold shadow-lg mx-auto"
                      style={{
                        width: `${width}px`,
                        height: `${height}px`,
                        maxWidth: '100%'
                      }}
                    >
                      {config?.width || 800} × {config?.height || 450}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Uploader */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Upload & Crop</h2>
            
            <UploaderWithCropper
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
              context={selectedContext}
              folder="demo"
              title={`Crop ${getContextDisplayName(selectedContext)}`}
            />

            {imageUrl && (
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Uploaded Result
                </label>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <img
                    src={imageUrl}
                    alt="Uploaded result"
                    className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
                <button
                  onClick={() => setImageUrl('')}
                  className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Clear Image
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
          How to Use
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-700 dark:text-blue-300">
          <li>Select a context from the left sidebar to see its aspect ratio requirements</li>
          <li>Upload an image using the uploader on the right</li>
          <li>The cropper will automatically open with the correct aspect ratio</li>
          <li>Adjust the crop area, zoom, and rotation as needed</li>
          <li>Click "Apply Crop" to see the final result</li>
          <li>The cropped image will fit perfectly in the intended canvas</li>
        </ol>
      </div>

      {/* Implementation Code */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Implementation Code</h3>
        <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<UploaderWithCropper
  imageUrl={imageUrl}
  setImageUrl={setImageUrl}
  context="${selectedContext}"
  folder="your-folder"
  title="Upload ${getContextDisplayName(selectedContext)}"
/>`}
        </pre>
      </div>
    </div>
  );
};

export default CropperDemo; 