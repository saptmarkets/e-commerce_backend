import React from "react";
import { useTranslation } from "react-i18next";
import { FiEdit, FiTrash2, FiCheck, FiX } from "react-icons/fi";

const UnitTable = ({ units, handleUpdate, handleDelete }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const renderStatusBadge = (status) => {
    const isActive = status === 'show';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getDisplayName = (unit) => {
    if (isArabic && unit.nameAr) {
      return unit.nameAr;
    }
    return unit.name;
  };

  const renderUnitName = (unit) => {
    const displayName = getDisplayName(unit);
    const hasArabicName = unit.nameAr && unit.nameAr.trim() !== '';
    
    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100" dir={isArabic ? 'rtl' : 'ltr'}>
          {displayName}
        </span>
        {/* Show alternate language name if available */}
        {hasArabicName && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1" dir={isArabic ? 'ltr' : 'rtl'}>
            {isArabic ? unit.name : unit.nameAr}
          </span>
        )}
        {/* Show indicator if Arabic name is missing */}
        {!hasArabicName && (
          <span className="text-xs text-orange-500 dark:text-orange-400 mt-1">
            {t('Arabic name not set')}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-sm rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('Name')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('Short Code')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('Type')}
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('Base Unit')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('Status')}
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('Actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {units.map((unit) => (
            <tr key={unit._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                {renderUnitName(unit)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                  {unit.shortCode}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <span className="capitalize">{unit.type}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {unit.isBase ? (
                  <FiCheck className="w-6 h-6 text-green-500 mx-auto" />
                ) : (
                  <FiX className="w-6 h-6 text-gray-400 mx-auto" />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {renderStatusBadge(unit.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center space-x-2 justify-end">
                  <button
                    onClick={() => handleUpdate(unit)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    title={t('Edit Unit')}
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(unit._id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title={t('Delete Unit')}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UnitTable; 