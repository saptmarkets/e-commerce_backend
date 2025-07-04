import React from 'react';

const Tags = ({ product }) => {
  if (!product || !product.tag) {
    return null;
  }
  
  try {
    // Try to parse the tag as JSON
    const tags = typeof product.tag === 'string' ? JSON.parse(product.tag) : [];
    
    if (!Array.isArray(tags) || tags.length === 0) {
      return null;
    }
    
    return (
      <div className="flex flex-row">
        {tags.map((t, i) => (
          <span
            key={i + 1}
            className="bg-gray-50 mr-2 border-0 text-gray-600 rounded-full inline-flex items-center justify-center px-3 py-1 text-xs font-semibold font-serif mt-2"
          >
            {t}
          </span>
        ))}
      </div>
    );
  } catch (error) {
    // If JSON parsing fails, return null
    console.error("Error parsing product tags:", error);
    return null;
  }
};

export default Tags;
