import React from 'react';
import NeonSpinner from './NeonSpinner';

const LoaderAnimation = () => {
  return (
    <div className="fixed top-0 left-0 z-50 w-full h-full flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4">
        <NeonSpinner size="2xl" />
        <p className="text-gray-600 font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
};

export default LoaderAnimation; 