import React, { useState, useEffect } from "react";
import { t } from "i18next";
import { FiZoomIn, FiInfo } from "react-icons/fi";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";

//internal import
import MainDrawer from "@/components/drawer/MainDrawer";
import ProductDrawer from "@/components/drawer/ProductDrawer";
import CheckBox from "@/components/form/others/CheckBox";
import DeleteModal from "@/components/modal/DeleteModal";
import EditDeleteButton from "@/components/table/EditDeleteButton";
import ShowHideButton from "@/components/table/ShowHideButton";
import Tooltip from "@/components/tooltip/Tooltip";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import ProductServices from "@/services/ProductServices";
import { SimpleTableBody, SimpleTableCell, SimpleTableRow } from "@/components/table/SimpleTable";

const ProductTable = ({ products, isCheck, setIsCheck }) => {
  const { title, serviceId, handleModalOpen, handleUpdate } = useToggleDrawer();
  const { currency, showingTranslateValue, getNumberTwo } = useUtilsFunction();
  const [expandedProducts, setExpandedProducts] = useState({});
  const [productUnits, setProductUnits] = useState({});
  const [loadingUnits, setLoadingUnits] = useState({});

  useEffect(() => {
    // Reset expanded state when products change
    setExpandedProducts({});
  }, [products]);

  const handleClick = (e) => {
    const { id, checked } = e.target;
    setIsCheck([...isCheck, id]);
    if (!checked) {
      setIsCheck(isCheck.filter((item) => item !== id));
    }
  };

  const toggleExpand = async (productId) => {
    // Toggle the expanded state for this product
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));

    // If expanding and we don't have units data yet, fetch it
    if (!expandedProducts[productId] && !productUnits[productId]) {
      try {
        setLoadingUnits(prev => ({ ...prev, [productId]: true }));
        const response = await ProductServices.getProductUnits(productId);
        if (response?.data) {
          setProductUnits(prev => ({
            ...prev,
            [productId]: response.data
          }));
        }
        setLoadingUnits(prev => ({ ...prev, [productId]: false }));
      } catch (error) {
        console.error("Error fetching product units:", error);
        setLoadingUnits(prev => ({ ...prev, [productId]: false }));
      }
    }
  };

  return (
    <>
      {isCheck?.length < 1 && <DeleteModal id={serviceId} title={title} />}

      {isCheck?.length < 2 && (
        <MainDrawer>
          <ProductDrawer currency={currency} id={serviceId} />
        </MainDrawer>
      )}

      <SimpleTableBody>
        {products?.map((product, i) => (
          <React.Fragment key={product._id}>
            <SimpleTableRow 
              key={i + 1}
              className={`transition-colors duration-150 hover:bg-gray-50 ${expandedProducts[product._id] ? "bg-blue-50 border-b-0 shadow-sm" : ""}`}
            >
              <SimpleTableCell>
                <CheckBox
                  type="checkbox"
                  name={product?.title?.en}
                  id={product._id}
                  handleClick={handleClick}
                  isChecked={isCheck?.includes(product._id)}
                />
              </SimpleTableCell>

              <SimpleTableCell>
                <div className="flex items-center">
                  <button 
                    onClick={() => toggleExpand(product._id)}
                    className="mr-2 text-gray-500 hover:text-blue-600 focus:outline-none"
                  >
                    {expandedProducts[product._id] ? (
                      <FiChevronDown className="w-5 h-5" />
                    ) : (
                      <FiChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  {product?.image[0] ? (
                    <div className="hidden p-1 mr-2 md:block bg-gray-50 shadow-none w-10 h-10 rounded-full overflow-hidden">
                      <img
                        className="w-full h-full object-cover"
                        src={product?.image[0]}
                        alt="product"
                      />
                    </div>
                  ) : (
                    <div className="hidden p-1 mr-2 md:block bg-gray-50 shadow-none w-10 h-10 rounded-full overflow-hidden">
                      <img
                        className="w-full h-full object-cover"
                        src={`https://res.cloudinary.com/dxjobesyt/image/upload/v1752706908/placeholder_kvepfp_wkyfut.png`}
                        alt="product"
                      />
                    </div>
                  )}
                  <div>
                    <h2 className={`text-xs font-medium ${product?.title.length > 30 ? "wrap-long-title" : ""}`}>
                      {showingTranslateValue(product?.title)?.substring(0, 35)}
                    </h2>
                  </div>
                </div>
              </SimpleTableCell>

              <SimpleTableCell>
                <span className="text-xs">
                  {showingTranslateValue(product?.category?.name)}
                </span>
              </SimpleTableCell>

              <SimpleTableCell>
                <span className="text-xs font-semibold">
                  {currency}
                  {product?.isCombination
                    ? getNumberTwo(product?.variants[0]?.price || product?.variants[0]?.originalPrice)
                    : getNumberTwo(product?.prices?.price || product?.price)}
                </span>
              </SimpleTableCell>

              <SimpleTableCell>
                <div className="flex items-center space-x-1">
                <span className="text-xs">{product.stock}</span>
                  {product.locationStocks && product.locationStocks.length > 0 && (
                    <Tooltip
                      id={`stock-${product._id}`}
                      Icon={FiInfo}
                      title={product.locationStocks
                        .map((ls) => `${ls.name || ls.locationId}: ${ls.qty}`)
                        .join(" | ")}
                      bgColor="#3B82F6"
                    />
                  )}
                </div>
              </SimpleTableCell>
              
              <SimpleTableCell>
                {product.stock > 0 ? (
                  <span className="px-2 py-1 text-xs font-medium rounded-full text-green-700 bg-green-100">
                    {t("Selling")}
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium rounded-full text-red-700 bg-red-100">
                    {t("SoldOut")}
                  </span>
                )}
              </SimpleTableCell>
              
              <SimpleTableCell>
                <Link
                  to={`/product/${product._id}`}
                  className="flex justify-center text-gray-400 hover:text-emerald-600"
                >
                  <Tooltip
                    id="view"
                    Icon={FiZoomIn}
                    title={t("DetailsTbl")}
                    bgColor="#10B981"
                  />
                </Link>
              </SimpleTableCell>
              
              <SimpleTableCell className="text-center">
                <ShowHideButton id={product._id} status={product.status} />
              </SimpleTableCell>
              
              <SimpleTableCell>
                <EditDeleteButton
                  id={product._id}
                  product={product}
                  isCheck={isCheck}
                  handleUpdate={handleUpdate}
                  handleModalOpen={handleModalOpen}
                  title={showingTranslateValue(product?.title)}
                />
              </SimpleTableCell>
            </SimpleTableRow>

            {/* Expanded units section */}
            {expandedProducts[product._id] && (
              <SimpleTableRow key={`${i}_units`} className="bg-blue-50 border-t border-blue-100">
                <SimpleTableCell colSpan={9} className="p-0">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 rounded-b-lg shadow-inner">
                    <h3 className="text-sm font-semibold mb-3 text-blue-800 flex items-center">
                      <span className="w-1 h-5 bg-blue-500 rounded-full mr-2"></span>
                      Product Units
                    </h3>
                    
                    {loadingUnits[product._id] ? (
                      <div className="py-8 flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading units...</span>
                      </div>
                    ) : productUnits[product._id]?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {productUnits[product._id].map((unit, uIndex) => (
                              <tr 
                                key={uIndex} 
                                className={`hover:bg-gray-50 transition-colors duration-150 ${unit.isDefault ? "bg-blue-50" : ""}`}
                              >
                                <td className="px-3 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full mr-2 ${unit.isDefault ? "bg-blue-500" : "bg-gray-300"}`}></span>
                                    <span className="text-sm font-medium text-gray-900">
                                      {unit.unitId?.name || "Unknown"}
                                      {unit.isDefault && (
                                        <span className="ml-1 text-xs font-normal text-blue-600">(Default)</span>
                                      )}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                  <span className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded-full">{unit.unitValue}x</span>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                  <span className="text-sm font-medium text-gray-900">
                                    {currency}{getNumberTwo(unit.price)}
                                  </span>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {unit.sku || "-"}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                  {unit.isActive ? (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full text-green-700 bg-green-100">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full text-red-700 bg-red-100">
                                      Inactive
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-sm text-gray-500 mb-2">No units found for this product.</p>
                        <p className="text-xs text-gray-400">You can add different units from the product edit page.</p>
                      </div>
                    )}
                  </div>
                </SimpleTableCell>
              </SimpleTableRow>
            )}
          </React.Fragment>
        ))}
      </SimpleTableBody>
    </>
  );
};

export default ProductTable;
