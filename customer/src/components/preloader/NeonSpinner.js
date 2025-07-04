import React from 'react';

const NeonSpinner = React.memo(({ size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: { width: '16px', height: '16px', borderWidth: '1px' },
    sm: { width: '24px', height: '24px', borderWidth: '2px' },
    md: { width: '32px', height: '32px', borderWidth: '2px' },
    lg: { width: '48px', height: '48px', borderWidth: '3px' },
    xl: { width: '64px', height: '64px', borderWidth: '3px' },
    '2xl': { width: '80px', height: '80px', borderWidth: '4px' }
  };

  const spinnerSize = sizeClasses[size];

  const spinnerStyle = {
    width: spinnerSize.width,
    height: spinnerSize.height,
    border: `${spinnerSize.borderWidth} solid #f3f4f6`,
    borderTop: `${spinnerSize.borderWidth} solid #000000`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    display: 'inline-block'
  };

  return (
    <div 
      className={className}
      style={spinnerStyle}
    />
  );
});

NeonSpinner.displayName = 'NeonSpinner';

export default NeonSpinner; 