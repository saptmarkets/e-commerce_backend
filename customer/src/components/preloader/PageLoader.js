import React from 'react';
import NeonSpinner from './NeonSpinner';

const PageLoader = React.memo(() => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 99999
      }}
    >
      <NeonSpinner size="lg" />
    </div>
  );
});

PageLoader.displayName = 'PageLoader';

export default PageLoader; 