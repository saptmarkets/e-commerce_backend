import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const SupermarketStats = () => {
  // Stats data
  const stats = [
    { value: 'Thousands of', label: ' Satisfied Customers' },
    { value: ' Exclusive', label: ' Product Range' },
    { value: '24/7', label: 'Customer Support Excellence' },
    { value: '4.8/5', label: 'Average Customer Rating' }
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div>
            <div className="mb-8">
              <h2 className="font-bold mb-2">
                <span className="text-4xl md:text-5xl" style={{ color: "#76bd44" }}>Why Choose</span><br />
                <span className="text-4xl md:text-5xl text-gray-800">SAPT</span><br />
                <span className="text-4xl md:text-5xl" style={{ color: "#74338c" }}>Markets?</span>
              </h2>
              <h3 className="text-2xl text-gray-800 font-semibold mt-4">Saudi Arabia's Leading Online Supermarket</h3>
              <p className="text-gray-600 mt-6 mb-8 max-w-md text-lg">
                Discover thousands of premium products across all categories — from fresh produce to household essentials — all at competitive prices with unmatched convenience.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/products" 
                className="px-8 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition duration-200"
              >
                Start Shopping
              </Link>
              <Link 
                href="/about-us" 
                className="px-8 py-3 border border-purple-700 text-purple-700 font-medium rounded-md hover:bg-purple-50 transition duration-200"
              >
                Learn Our Story
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-lg text-center shadow-sm">
                <h3 className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{stat.value}</h3>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupermarketStats; 