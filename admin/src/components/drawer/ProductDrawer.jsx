import React, { useEffect, useState } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import { Input, Button, Textarea, Select, Tab, Badge } from "@windmill/react-ui";
import { FiPlus, FiTrash2, FiPackage } from "react-icons/fi";
import Title from "@/components/form/others/Title";
import LabelArea from "@/components/form/selectOption/LabelArea";
import Error from "@/components/form/others/Error";
import InputArea from "@/components/form/input/InputArea";
import DrawerButton from "@/components/form/button/DrawerButton";
import UploaderWithCropper from "@/components/image-uploader/UploaderWithCropper";
import ProductCategorySelector from "@/components/category/ProductCategorySelector";
import UnitServices from "@/services/UnitServices";
import ProductUnitServices from "@/services/ProductUnitServices";
import CategoryServices from "@/services/CategoryServices";
import useProductSubmit from "@/hooks/useProductSubmit";
import ProductServices from "@/services/ProductServices";
import { notifyError, notifySuccess } from "@/utils/toast";

const ProductDrawer = ({ id }) => {
  const {
    register,
    handleSubmit,
    onSubmit,
    errors,
    imageUrl,
    setImageUrl,
    watch,
    setValue,
    control,
    reset,
    productUnits,
    setProductUnits,
    handleAddUnit: hookHandleAddUnit,
    handleEditUnit,
    handleRemoveUnit: hookHandleRemoveUnit
  } = useProductSubmit(id);

  const [activeTab, setActiveTab] = useState("basic");
  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // State for the new unit form
  const [newUnit, setNewUnit] = useState({
    unit: "",
    label: "",
    packQty: 1,
    price: 0,
    sku: "",
    barcode: "",
    isDefault: false,
  });

  // Watch for the basicUnit and price values
  const basicUnit = watch("basicUnit");
  const basePrice = watch("price");

  // Fetch units
  useEffect(() => {
    const fetchUnits = async () => {
      setUnitsLoading(true);
      try {
        const response = await UnitServices.getShowingUnits();
        if (response && response.units && response.units.length > 0) {
          setUnits(response.units);
        } else {
          const allResponse = await UnitServices.getAllUnits();
          if (allResponse && allResponse.units) {
            setUnits(allResponse.units);
          } else if (Array.isArray(allResponse)) {
            setUnits(allResponse);
          }
        }
      } catch (error) {
        console.error("Error fetching units:", error);
        try {
          const basicUnits = await UnitServices.getBasicUnits();
          if (basicUnits && Array.isArray(basicUnits)) {
            setUnits(basicUnits);
          }
        } catch (fallbackError) {
          console.error("Error in fallback units fetch:", fallbackError);
        }
      } finally {
        setUnitsLoading(false);
      }
    };
    
    fetchUnits();
  }, []);

  // Fetch categories (hierarchical structure)
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await CategoryServices.getAllCategory();
        if (Array.isArray(response)) {
          setCategories(response);
        } else if (response && response.categories) {
          setCategories(response.categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  // Fetch product and its units when editing
  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        setProductLoading(true);
        try {
          const productResult = await ProductServices.getProductById(id);
          if (productResult) {
            const product = productResult.product || productResult;
            
            // Set basic product fields
            setValue("title", product.title?.en || "");
            setValue("titleAr", product.title?.ar || "");
            setValue("description", product.description?.en || "");
            setValue("descriptionAr", product.description?.ar || "");
            setValue("slug", product.slug || "");
            setValue("price", product.price || 0);
            setValue("stock", product.stock || 0);
            setValue("sku", product.sku || "");
            setValue("barcode", product.barcode || "");
            setValue("basicUnit", product.basicUnit?._id || product.basicUnit);
            setValue("category", product.category?._id || product.category);
            setValue("status", product.status || "show");
            
            if (product.image) {
              setImageUrl(Array.isArray(product.image) ? product.image : [product.image]);
            }

            // Fetch product units
            const unitsResult = await ProductUnitServices.getProductUnits(id);
            if (unitsResult && unitsResult.data) {
              const fetchedUnits = Array.isArray(unitsResult.data) ? unitsResult.data : [];
              setProductUnits(fetchedUnits);
            }
          }
        } catch (error) {
          console.error("Error fetching product details:", error);
        } finally {
          setProductLoading(false);
        }
      };
      
      fetchProduct();
    }
  }, [id, setValue, setImageUrl, setProductUnits]);

  // Handle adding a new unit
  const handleAddUnit = (data) => {
    if (!data.unit) {
      notifyError('Unit selection is required');
      return;
    }
    
    const selectedUnit = units.find(u => u._id === data.unit);
    
    if (!data.price || isNaN(parseFloat(data.price))) {
      notifyError('Valid price is required');
      return;
    }
    
    if (!data.packQty || isNaN(parseFloat(data.packQty))) {
      notifyError('Valid pack quantity is required');
      return;
    }

    const packQtyValue = parseFloat(data.packQty);
    if (packQtyValue < 0.001) {
      notifyError('Pack quantity must be at least 0.001');
      return;
    }

    const unitWithExtras = {
      ...data,
      unit: data.unit,
      unitId: data.unit,
      unitValue: 1,
      packQty: packQtyValue,
      label: data.label || "",
      price: parseFloat(data.price),
      unitName: selectedUnit?.name || 'Unknown',
    };
    
    hookHandleAddUnit(unitWithExtras);
    
    setNewUnit({
      unit: '',
      label: '',
      packQty: '',
      price: '',
      sku: '',
      barcode: '',
      isDefault: false
    });
    
    notifySuccess("Unit added successfully");
  };

  // Handle removing a unit
  const handleRemoveUnit = async (unitIdOrIndex) => {
    try {
      const unitToRemove = productUnits[unitIdOrIndex];
      
      if (id && unitToRemove && unitToRemove._id) {
        await ProductUnitServices.deleteProductUnit(id, unitToRemove._id);
      }
      
      hookHandleRemoveUnit(unitIdOrIndex);
      notifySuccess("Unit removed successfully");
    } catch (error) {
      console.error("Error removing product unit:", error);
      notifyError("Failed to remove unit");
    }
  };

  // Handle new unit field changes
  const handleUnitChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUnit({
      ...newUnit,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Calculate the per-unit price
  const calculatePerUnitPrice = (price, packQty) => {
    if (!packQty || packQty <= 0) return 0;
    return price / packQty;
  };

  // Format price to 2 decimal places
  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
  };

  // Get unit name by ID
  const getUnitName = (unitId) => {
    if (!unitId) return 'N/A';
    const unit = units.find(u => u._id === unitId);
    return unit ? unit.name : 'Unknown Unit';
  };

  return (
    <>
             {/* Header Section */}
       <div className="w-full relative p-3 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
         <div className="flex md:flex-row flex-col justify-between mr-2 ml-2">
          <div>
            <Title
              register={register}
              handleSelectLanguage={() => {}}
              title={id ? "Update Product" : "Add Product"}
              description={id ? "Update your product and necessary information from here" : "Add your product and necessary information from here"}
            />
          </div>
        </div>
      </div>

             {/* Tabs */}
       <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
         <button
           className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors duration-200 ${
             activeTab === "basic"
               ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
               : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
           }`}
           onClick={() => setActiveTab("basic")}
         >
           Basic Info
         </button>
         <button
           className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors duration-200 ${
             activeTab === "units"
               ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
               : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
           }`}
           onClick={() => setActiveTab("units")}
         >
           Multi Units
         </button>
       </div>

      {/* Body Section */}
      <div className="flex-grow bg-white dark:bg-gray-700 dark:text-gray-200 overflow-hidden">
        <Scrollbars style={{ width: "100%", height: "calc(100vh - 200px)" }}>
                     <div className="w-full p-3">
            {activeTab === "basic" && (
                             <div className="space-y-2">
                 <div className="grid grid-cols-6 gap-2 md:gap-2 xl:gap-2 lg:gap-2 mb-2">
                  <LabelArea label="Product Image" />
                  <div className="col-span-8 sm:col-span-4">
                    <UploaderWithCropper
                      imageUrl={imageUrl}
                      setImageUrl={setImageUrl}
                      context="product"
                      product={true}
                      folder="products"
                      title="Upload Product Images"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 md:gap-2 xl:gap-2 lg:gap-2 mb-2">
                  <LabelArea label="Product Title/Name (EN)" />
                  <div className="col-span-8 sm:col-span-4">
                    <Input
                      {...register("title", {
                        required: "Product title is required!",
                      })}
                      className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                      name="title"
                      type="text"
                      placeholder="Product title"
                    />
                    <Error errorName={errors.title} />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 md:gap-2 xl:gap-2 lg:gap-2 mb-2">
                  <LabelArea label="Product Title/Name (AR)" />
                  <div className="col-span-8 sm:col-span-4">
                    <Input
                      {...register("titleAr")}
                      className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                      name="titleAr"
                      type="text"
                      placeholder="Product title in Arabic"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 md:gap-2 xl:gap-2 lg:gap-2 mb-2">
                  <LabelArea label="Slug / URL Name" />
                  <div className="col-span-8 sm:col-span-4">
                    <Input
                      {...register("slug")}
                      className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                      name="slug"
                      type="text"
                      placeholder="product-url-name"
                    />
                    <Error errorName={errors.slug} />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 md:gap-2 xl:gap-2 lg:gap-2 mb-2">
                  <LabelArea label="Category" />
                  <div className="col-span-8 sm:col-span-4">
                    <ProductCategorySelector
                      categories={categories}
                      categoriesLoading={categoriesLoading}
                      selectedCategory={watch("category")}
                      onCategorySelect={(categoryId) => setValue("category", categoryId)}
                      register={register}
                      errors={errors}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 md:gap-2 xl:gap-2 lg:gap-2 mb-2">
                  <LabelArea label="Default Unit" />
                  <div className="col-span-8 sm:col-span-4">
                    <Select
                      {...register("basicUnit", {
                        required: "Default unit is required!",
                      })}
                      className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                      name="basicUnit"
                    >
                      <option value="">Select Unit</option>
                      {unitsLoading ? (
                        <option disabled>Loading units...</option>
                      ) : units && units.length > 0 ? (
                        units.map((unit) => (
                          <option key={unit._id} value={unit._id}>
                            {unit.name}
                          </option>
                        ))
                      ) : (
                        <option disabled>No units available</option>
                      )}
                    </Select>
                    <Error errorName={errors.basicUnit} />
                    {units && units.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        No units found. Please add units first from the Units page.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 md:gap-2 xl:gap-2 lg:gap-2 mb-2">
                  <LabelArea label="Default Pack Qty" />
                  <div className="col-span-8 sm:col-span-4">
                    <Input
                      disabled
                      className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                      type="number"
                      value="1"
                    />
                    <span className="text-xs text-gray-500">This is fixed to 1 for the base unit</span>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 md:gap-2 xl:gap-2 lg:gap-2 mb-2">
                  <LabelArea label="Default Selling Price" />
                  <div className="col-span-8 sm:col-span-4">
                    <Input
                      {...register("price", {
                        required: "Price is required!",
                        min: {
                          value: 0,
                          message: "Price must be positive!",
                        },
                      })}
                      className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                      name="price"
                      type="number"
                      step="0.01"
                      placeholder="Selling price"
                    />
                    <Error errorName={errors.price} />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 md:gap-2 xl:gap-2 lg:gap-2 mb-2">
                  <LabelArea label="Product Description (EN)" />
                  <div className="col-span-8 sm:col-span-4">
                    <Textarea
                      {...register("description")}
                      className="border text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                      name="description"
                      rows={3}
                      placeholder="Product description"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 md:gap-2 xl:gap-2 lg:gap-2 mb-2">
                  <LabelArea label="Product Description (AR)" />
                  <div className="col-span-8 sm:col-span-4">
                    <Textarea
                      {...register("descriptionAr")}
                      className="border text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                      name="descriptionAr"
                      rows={3}
                      placeholder="Product description in Arabic"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 md:gap-2 xl:gap-2 lg:gap-2 mb-2">
                  <LabelArea label="Stock" />
                  <div className="col-span-8 sm:col-span-4">
                    <Input
                      {...register("stock", {
                        required: "Stock is required!",
                        min: {
                          value: 0,
                          message: "Stock cannot be negative!",
                        },
                      })}
                      className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                      name="stock"
                      type="number"
                      placeholder="Stock quantity"
                    />
                    <Error errorName={errors.stock} />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 md:gap-2 xl:gap-2 lg:gap-2 mb-2">
                  <LabelArea label="SKU" />
                  <div className="col-span-8 sm:col-span-4">
                    <Input
                      {...register("sku")}
                      className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                      name="sku"
                      type="text"
                      placeholder="Product SKU"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 md:gap-2 xl:gap-2 lg:gap-2 mb-2">
                  <LabelArea label="Barcode" />
                  <div className="col-span-8 sm:col-span-4">
                    <Input
                      {...register("barcode")}
                      className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                      name="barcode"
                      type="text"
                      placeholder="Product barcode"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 md:gap-2 xl:gap-2 lg:gap-2 mb-2">
                  <LabelArea label="Status" />
                  <div className="col-span-8 sm:col-span-4">
                    <Select
                      {...register("status")}
                      className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                      name="status"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Multi Units Tab */}
            {activeTab === "units" && (
              <div className="space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <FiPackage className="w-4 h-4 text-yellow-600 mr-2" />
                    <h3 className="text-sm font-medium text-yellow-800">Multi-Unit Configuration</h3>
                  </div>
                  <p className="text-xs text-yellow-700">
                    Add different units for this product (e.g., individual pieces, packs of 12, cases of 24).
                    Each unit will have its own price and SKU.
                  </p>
                </div>

                {/* Current Units List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Current Units ({productUnits.length})
                  </h4>
                  
                  {productUnits.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Unit
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Pack Qty
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Per Unit
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                SKU
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {productUnits.map((unit, index) => (
                              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                  <div className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full mr-2 ${unit.isDefault ? "bg-green-500" : "bg-gray-300"}`}></span>
                                    {unit.unit?.name || getUnitName(unit.unit) || 'Unknown Unit'}
                                    {unit.isDefault && (
                                      <Badge type="success" className="ml-2 text-xs">Default</Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                  {unit.packQty}x
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                                  {formatPrice(unit.price)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {formatPrice(calculatePerUnitPrice(unit.price, unit.packQty))}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {unit.sku || '-'}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  <button
                                    onClick={() => handleRemoveUnit(index)}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    type="button"
                                    title="Remove unit"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300">
                      <FiPackage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No units added yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Add your first unit below</p>
                    </div>
                  )}
                </div>

                {/* Add new unit form */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border">
                  <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Add New Unit</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Unit *
                      </label>
                      <select
                        name="unit"
                        value={newUnit.unit}
                        onChange={handleUnitChange}
                        className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white rounded"
                        required
                      >
                        <option value="">Select Unit</option>
                        {unitsLoading ? (
                          <option disabled>Loading units...</option>
                        ) : units && units.length > 0 ? (
                          units.map((unit) => (
                            <option key={unit._id} value={unit._id}>
                              {unit.name}
                            </option>
                          ))
                        ) : (
                          <option disabled>No units available</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Pack Qty *
                      </label>
                      <input
                        name="packQty"
                        type="number"
                        min="1"
                        step="1"
                        value={newUnit.packQty}
                        onChange={handleUnitChange}
                        className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white rounded"
                        placeholder="Package quantity"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Price *
                      </label>
                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newUnit.price}
                        onChange={handleUnitChange}
                        className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white rounded"
                        placeholder="Selling price"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        SKU
                      </label>
                      <input
                        name="sku"
                        value={newUnit.sku}
                        onChange={handleUnitChange}
                        className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white rounded"
                        placeholder="Unit SKU"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Barcode
                      </label>
                      <input
                        name="barcode"
                        value={newUnit.barcode}
                        onChange={handleUnitChange}
                        className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white rounded"
                        placeholder="Unit barcode"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Label (Optional)
                      </label>
                      <input
                        name="label"
                        value={newUnit.label}
                        onChange={handleUnitChange}
                        className="border h-8 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white rounded"
                        placeholder="Display label"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="isDefault"
                        name="isDefault"
                        type="checkbox"
                        checked={newUnit.isDefault}
                        onChange={handleUnitChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isDefault" className="ml-2 block text-xs text-gray-700 dark:text-gray-300">
                        Set as default unit
                      </label>
                    </div>
                    
                    <Button 
                      onClick={() => handleAddUnit(newUnit)} 
                      className="bg-blue-500 hover:bg-blue-600 h-8 px-3 text-sm"
                      type="button"
                    >
                      <FiPlus className="w-4 h-4 mr-1" />
                      Add Unit
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Scrollbars>
      </div>

             {/* Footer */}
       <div className="fixed bottom-0 w-full p-2 border-t border-gray-100 bg-white dark:bg-gray-800 dark:border-gray-700">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerButton 
            id={id} 
            title="Product" 
            loading={productLoading} 
            isSubmitting={false} 
          />
        </form>
      </div>
    </>
  );
};

export default ProductDrawer; 
