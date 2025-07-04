import React from 'react';

export const SimpleTable = ({ children, className = '' }) => {
  return (
    <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
      {children}
    </table>
  );
};

export const SimpleTableHeader = ({ children, className = '' }) => {
  return (
    <thead className={`bg-emerald-50 dark:bg-emerald-900/10 ${className}`}>
      {children}
    </thead>
  );
};

export const SimpleTableRow = ({ children, className = '' }) => {
  return (
    <tr className={`transition-colors ${className}`}>
      {children}
    </tr>
  );
};

export const SimpleTableCell = ({ children, className = '', colSpan }) => {
  return (
    <td 
      colSpan={colSpan} 
      className={`px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200 ${className}`}
    >
      {children}
    </td>
  );
};

export const SimpleTableHeaderCell = ({ children, className = '' }) => {
  return (
    <th scope="col" className={`px-4 py-3 text-left text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
};

export const SimpleTableBody = ({ children, className = '' }) => {
  return (
    <tbody className={`bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700 ${className}`}>
      {children}
    </tbody>
  );
};

export const SimpleTableContainer = ({ children, className = '' }) => {
  return (
    <div className={`shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      {children}
    </div>
  );
};

export const SimpleTableFooter = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-50 dark:bg-gray-800 ${className}`}>
      {children}
    </div>
  );
};

export const SimplePagination = ({ 
  totalResults, 
  resultsPerPage = 10, 
  currentPage = 1, 
  onChange,
  className = '' 
}) => {
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are fewer than maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Calculate middle pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if at the beginning
      if (currentPage <= 2) {
        endPage = 4;
      }
      
      // Adjust if at the end
      if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always show last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  return (
    <div className={`px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 ${className}`}>
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium mx-1">{Math.min((currentPage - 1) * resultsPerPage + 1, totalResults)}</span>
        to <span className="font-medium mx-1">{Math.min(currentPage * resultsPerPage, totalResults)}</span>
        of <span className="font-medium mx-1">{totalResults}</span> results
      </div>
      
      <div className="hidden sm:flex sm:items-center sm:space-x-2">
        <button
          onClick={() => onChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="sr-only">Previous</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                ...
              </span>
            ) : (
              <button
                onClick={() => onChange(page)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  currentPage === page
                    ? 'z-10 bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                } border transition-colors`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
        
        <button
          onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="sr-only">Next</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="flex sm:hidden">
        <button
          onClick={() => onChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default {
  SimpleTable,
  SimpleTableHeader,
  SimpleTableRow,
  SimpleTableCell,
  SimpleTableHeaderCell,
  SimpleTableBody,
  SimpleTableContainer,
  SimpleTableFooter,
  SimplePagination
}; 