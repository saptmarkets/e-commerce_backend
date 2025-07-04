import React, { useState } from 'react';
import { FiSend } from 'react-icons/fi';

const NewsletterSection = ({ title = "Newsletter Section Title", description = "Subscribe to our newsletter for updates and promotions" }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle newsletter submission logic here
    console.log('Newsletter subscription for:', email);
    setEmail('');
    // You might want to add a success notification here
  };

  return (
    <div className="bg-primary py-10 md:py-16 rounded-lg">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{title}</h2>
          <p className="text-white/80 max-w-xl mx-auto">{description}</p>
        </div>
        
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-grow py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
            <button
              type="submit"
              className="bg-secondary text-white font-medium py-3 px-6 rounded-md hover:bg-secondary/90 transition duration-200 flex items-center justify-center"
            >
              Subscribe
              <FiSend className="ml-2" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewsletterSection; 