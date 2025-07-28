import React, { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

const SearchSuggestions = ({ 
  searchValue, 
  onSuggestionClick, 
  onClear, 
  placeholder = "Search products...",
  suggestions = []
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setShowSuggestions(searchValue.length > 0 && suggestions.length > 0);
  }, [searchValue, suggestions]);

  const handleSuggestionClick = (suggestion) => {
    onSuggestionClick(suggestion);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    onClear();
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSuggestionClick(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          onFocus={() => setShowSuggestions(searchValue.length > 0 && suggestions.length > 0)}
        />
        {searchValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <FiX className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
            >
              <div className="flex items-center">
                <FiSearch className="h-4 w-4 text-gray-400 mr-2" />
                <span>{suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions; 