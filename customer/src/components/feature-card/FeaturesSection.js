import React from 'react';
import { FiTruck, FiHeadphones, FiPackage, FiCheckCircle } from 'react-icons/fi';

const FeaturesSection = ({ title = "Features Section Title", description = "Leading features that make us stand out" }) => {
  // Features data
  const features = [
    {
      id: 1,
      title: "Feature Title 1",
      description: "Short description about this feature",
      icon: <FiTruck className="w-6 h-6 text-primary" />,
      iconBgColor: "bg-primary/10"
    },
    {
      id: 2,
      title: "Feature Title 2",
      description: "Short description about this feature",
      icon: <FiHeadphones className="w-6 h-6 text-secondary" />,
      iconBgColor: "bg-secondary/10"
    },
    {
      id: 3,
      title: "Feature Title 3",
      description: "Short description about this feature",
      icon: <FiPackage className="w-6 h-6 text-primary" />,
      iconBgColor: "bg-primary/10"
    },
    {
      id: 4,
      title: "Feature Title 4",
      description: "Short description about this feature",
      icon: <FiCheckCircle className="w-6 h-6 text-secondary" />,
      iconBgColor: "bg-secondary/10"
    }
  ];

  return (
    <div className="bg-white py-10 md:py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
        <div className="mb-10 flex flex-col items-center justify-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{title}</h2>
          <p className="text-gray-600 text-center max-w-xl">{description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div 
              key={feature.id} 
              className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-md transition duration-200"
            >
              <div className={`${feature.iconBgColor} w-14 h-14 rounded-full flex items-center justify-center mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection; 