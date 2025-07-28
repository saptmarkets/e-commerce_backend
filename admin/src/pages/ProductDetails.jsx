import {
  Badge,
  Pagination,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
} from "@windmill/react-ui";
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router";
import { FiImage, FiPackage, FiBox, FiShoppingBag, FiDollarSign, FiBarChart2, FiLayers, FiInfo } from "react-icons/fi";
//internal import

import useAsync from "@/hooks/useAsync";
import useFilter from "@/hooks/useFilter";
import useProductSubmit from "@/hooks/useProductSubmit";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import ProductServices from "@/services/ProductServices";
import ProductUnitServices from "@/services/ProductUnitServices";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import AttributeList from "@/components/attribute/AttributeList";
import MainDrawer from "@/components/drawer/MainDrawer";
import ProductDrawer from "@/components/drawer/ProductDrawer";
import Loading from "@/components/preloader/Loading";
import PageTitle from "@/components/Typography/PageTitle";
import { SidebarContext } from "@/context/SidebarContext";

const ProductDetails = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { handleUpdate } = useToggleDrawer();
  const { attribue } = useProductSubmit(id);
  const [variantTitle, setVariantTitle] = useState([]);
  const { lang } = useContext(SidebarContext);
  const [activeTab, setActiveTab] = useState("basic");
  const [productUnits, setProductUnits] = useState([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const history = useHistory();

  const { data, loading, error } = useAsync(() => ProductServices.getProductById(id));

  const { currency, showingTranslateValue, getNumberTwo } = useUtilsFunction();

  const { handleChangePage, totalResults, resultsPerPage, dataTable } =
    useFilter(data?.variants || []);

  useEffect(() => {
    if (!loading && data && data.variants && Array.isArray(data.variants)) {
      try {
        const res = Object.keys(Object.assign({}, ...data.variants));

        const varTitle = attribue?.filter((att) =>
          // res.includes(att.title.replace(/[^a-zA-Z0-9]/g, ''))
          res.includes(att._id)
        );

        setVariantTitle(varTitle);
      } catch (error) {
        console.error('Error processing variant data:', error);
        setVariantTitle([]);
      }
    } else {
      // Reset variant title if no data or no variants
      setVariantTitle([]);
    }
  }, [attribue, data?.variants, loading, lang]);

  // Load product units
  useEffect(() => {
    const fetchProductUnits = async () => {
      if (id) {
        try {
          setIsLoadingUnits(true);
          const response = await ProductUnitServices.getProductUnits(id);
          if (response && response.data) {
            setProductUnits(Array.isArray(response.data) ? response.data : []);
          }
        } catch (error) {
          console.error('Error loading product units:', error);
          setProductUnits([]);
        } finally {
          setIsLoadingUnits(false);
        }
      }
    };

    fetchProductUnits();
  }, [id]);

  const formatPrice = (price) => {
    return `${currency}${getNumberTwo(price || 0)}`;
  };

  return (
    <>
      {/* Back Arrow Button */}
      <div className="mb-4">
        <button
          onClick={() => history.push('/products')}
          className="flex items-center text-emerald-600 hover:text-emerald-800 font-semibold text-lg gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('BackToProducts')}
        </button>
      </div>
      <MainDrawer product>
        <ProductDrawer id={id} />
      </MainDrawer>

      <PageTitle>{t("ProductDetails")}</PageTitle>
      {loading ? (
        <Loading loading={loading} />
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
            {t("Error Loading Product")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {error?.message || "Failed to load product data"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Product ID: {id}
          </p>
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
            <h4 className="text-sm font-semibold mb-2">Debug Information:</h4>
            <p className="text-xs text-gray-600">
              API Endpoint: {`${import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5055'}/api/products/${id}`}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Error: {error?.response?.status} - {error?.response?.data?.message || error?.message}
            </p>
            {error?.response?.status === 404 && (
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ Product not found. This product may not exist in the database, or the product ID is incorrect.
              </p>
            )}
          </div>
          <div className="flex space-x-2 mt-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
            <button 
              onClick={() => window.location.href = '/products'} 
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Products
            </button>
          </div>
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
            {t("ProductNotFound")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Product ID: {id}
          </p>
        </div>
      ) : (
        <div className="min-w-0 shadow-md overflow-hidden bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-5">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === "basic"
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("basic")}
            >
              <div className="flex items-center">
                <FiInfo className="w-4 h-4 mr-2" />
                {t('BasicInformation')}
              </div>
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === "units"
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("units")}
            >
              <div className="flex items-center">
                <FiPackage className="w-4 h-4 mr-2" />
                {t('Units')}
              </div>
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === "media"
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("media")}
            >
              <div className="flex items-center">
                <FiImage className="w-4 h-4 mr-2" />
                {t('MediaAndGalleries')}
              </div>
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === "inventory"
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("inventory")}
            >
              <div className="flex items-center">
                <FiBarChart2 className="w-4 h-4 mr-2" />
                {t('InventoryAndStock')}
              </div>
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === "storeStock"
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("storeStock")}
            >
              <div className="flex items-center">
                <FiBarChart2 className="w-4 h-4 mr-2" />
                {t('StoreStock')}
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-3">
            {/* Basic Information Tab */}
            {activeTab === "basic" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h3 className="text-base font-semibold mb-2">{t('ProductInfo')}</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('ProductName')}:
                      </span>
                      <p className="font-medium text-sm">
                        {showingTranslateValue(data?.title, lang)}
                      </p>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('ProductDescription')}:
                      </span>
                      <p className="text-xs mt-1">
                        {showingTranslateValue(data?.description, lang) || t('NoDescriptionProvided')}
                      </p>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('Category')}:
                      </span>
                      <p className="text-sm">
                        {data?.category?.name ? showingTranslateValue(data.category.name, lang) : t('Uncategorized')}
                      </p>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('BasicUnit')}:
                      </span>
                      <p className="text-sm">
                        {data?.basicUnit?.name || t('NotSpecified')}
                      </p>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('Price')}:
                      </span>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatPrice(data?.price)}
                      </p>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('SKU')}:
                      </span>
                      <p>
                        {data?.sku || t('NotAssigned')}
                      </p>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('Barcode')}:
                      </span>
                      <p>
                        {data?.barcode || t('NotAssigned')}
                      </p>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('Status')}:
                      </span>
                      {data?.status === 'show' ? (
                        <Badge type="success" className="ml-2">
                          {t('Active')}
                        </Badge>
                      ) : (
                        <Badge type="danger" className="ml-2">
                          {t('Inactive')}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('HasMultiUnits')}:
                      </span>
                      {data?.hasMultiUnits ? (
                        <Badge type="success" className="ml-2">
                          {t('Yes')}
                        </Badge>
                      ) : (
                        <Badge type="danger" className="ml-2">
                          {t('No')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">{t('ProductImages')}</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    {data?.image && data.image.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {data.image.map((img, i) => (
                          <div key={i} className="relative aspect-w-1 aspect-h-1">
                            <img
                              src={img}
                              alt={`Product ${i + 1}`}
                              className="w-full h-40 object-cover rounded"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-40 bg-gray-100 dark:bg-gray-800 rounded">
                        <p className="text-gray-500 dark:text-gray-400">
                          {t('NoImagesAvailable')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Units Tab */}
            {activeTab === "units" && (
              <div className="overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{t('ProductUnits')}</h3>
                  <button
                    onClick={() => handleUpdate(id)}
                    className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                  >
                    {t('EditProduct')}
                  </button>
                </div>

                {isLoadingUnits ? (
                  <div className="flex justify-center py-8">
                    <Loading loading={true} />
                  </div>
                ) : productUnits.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <FiPackage className="w-12 h-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-base font-medium text-gray-600 dark:text-gray-300">
                      {t('NoProductUnits')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('ThisProductDoesNotHaveAnyUnits')}
                    </p>
                    <button
                      onClick={() => handleUpdate(id)}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      {t('AddUnits')}
                    </button>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t('Unit')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t('PackQty')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t('Price')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t('PricePerUnit')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t('SKU')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t('Barcode')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t('Status')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {productUnits.map((unit, idx) => (
                          <tr key={unit._id}>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md">
                                  <FiBox className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {unit.unit?.name || unit.name || unit.unitName || unit.displayName || unit.unitDisplayName || t('UnknownUnit')}
                                    {unit.isDefault && (
                                      <Badge className="ml-2" type="success">
                                        {t('Default')}
                                      </Badge>
                                    )}
                                  </div>
                                  {unit.title && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {unit.title}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {unit.packQty}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {formatPrice(unit.price)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatPrice(unit.price / unit.packQty)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {unit.sku || '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {unit.barcode || '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {unit.isActive ? (
                                <Badge type="success">
                                  {t('Active')}
                                </Badge>
                              ) : (
                                <Badge type="danger">
                                  {t('Inactive')}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Media Tab */}
            {activeTab === "media" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('ProductMedia')}</h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  {data?.image && data.image.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {data.image.map((img, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={img}
                            alt={`Product ${i + 1}`}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <a
                              href={img}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
                            >
                              <FiImage className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-60 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <div className="text-center">
                        <FiImage className="w-12 h-12 mx-auto text-gray-400" />
                        <h3 className="mt-2 text-base font-medium text-gray-600 dark:text-gray-300">
                          {t('NoImagesAvailable')}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {t('ThisProductDoesNotHaveAnyImages')}
                        </p>
                        <button
                          onClick={() => handleUpdate(id)}
                          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          {t('AddImages')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === "inventory" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('InventoryInformation')}</h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                          <FiPackage className="w-6 h-6" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {t('CurrentStock')}
                          </p>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {data?.stock || 0}
                          </h3>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-500">
                          <FiShoppingBag className="w-6 h-6" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {t('TotalSales')}
                          </p>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {data?.sales || 0}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Units Stock Information (moved below) */}
                  {data?.hasMultiUnits && (
                    <div className="mt-6">
                      <h4 className="text-md font-medium mb-3">{t('UnitStockLevels')}</h4>
                      {isLoadingUnits ? (
                        <div className="flex justify-center py-4">
                          <Loading loading={true} />
                        </div>
                      ) : productUnits.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('NoUnitStockInformationAvailable')}
                        </p>
                      ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  {t('Unit')}
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  {t('BasePacks')}
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  {t('EquivalentBaseUnits')}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {productUnits.map((unit) => (
                                <tr key={unit._id}>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {unit.unit?.name || unit.name || unit.unitName || unit.displayName || unit.unitDisplayName || t('UnknownUnit')}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {Math.floor(data.stock / unit.packQty) || 0}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {data.stock} {data?.basicUnit?.name || t('units')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stock by Location */}
                  {data?.locationStocks && data.locationStocks.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-medium mb-3">Branch Stock Breakdown</h4>
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Qty</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {data.locationStocks.map((ls, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ls.name || ls.locationId}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{ls.qty}</td>
                              </tr>
                            ))}
                            <tr className="bg-gray-100 dark:bg-gray-700 font-semibold">
                              <td className="px-4 py-2">TOTAL</td>
                              <td className="px-4 py-2">{data.locationStocks.reduce((a, b) => a + (b.qty || 0), 0)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Store Stock Tab */}
            {activeTab === "storeStock" && data && (
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('StoreStock')}</h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('CurrentStock')}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {data.stock || 0}
                    </h3>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetails;
