import React, { useState } from 'react';

const HookTest = () => {
  const [count, setCount] = useState(0);

  console.log('HookTest component rendered successfully');

  return (
    <div className="p-4 border border-gray-300 rounded">
      <h3 className="text-lg font-bold mb-2">Hook Test Component</h3>
      <p>Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Increment
      </button>
      <p className="text-green-600 text-sm mt-2">✓ React hooks are working correctly</p>
    </div>
  );
};

export default HookTest; 