import combinate from "combinate";
import { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import swal from "sweetalert";

//internal import
import useAsync from "./useAsync";
import useUtilsFunction from "./useUtilsFunction";
import { SidebarContext } from "../context/SidebarContext";
import AttributeServices from "../services/AttributeServices";
import ProductServices from "../services/ProductServices";
import ProductUnitServices from "../services/ProductUnitServices";
import UnitServices from "../services/UnitServices";
import { notifyError, notifySuccess } from "../utils/toast";
import useTranslationValue from "./useTranslationValue";

const useProductSubmit = (id) => {
  const location = useLocation();
  const { isDrawerOpen, closeDrawer, setIsUpdate, lang } =
    useContext(SidebarContext);

  const { data: attribue } = useAsync(AttributeServices.getShowingAttributes);
  const { data: units } = useAsync(UnitServices.getShowingUnits);

  // react ref
  const resetRef = useRef([]);
  const resetRefTwo = useRef(null);

  // === MOVE useForm HOOK HERE BEFORE useEffect ===
  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm();

  // handle click
  const onCloseModal = () => setOpenModal(false);

  // react hook
  const [imageUrl, setImageUrl] = useState([]);
  const [tag, setTag] = useState([]);
  const [values, setValues] = useState({ units: [] });
  let [variants, setVariants] = useState([]);
  const [variant, setVariant] = useState([]);
  const [totalStock, setTotalStock] = useState(0);
  const [quantity, setQuantity] = useState(0);

  const [originalPrice, setOriginalPrice] = useState(0);
  const [price, setPrice] = useState(0);
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [isBasicComplete, setIsBasicComplete] = useState(false);
  const [tapValue, setTapValue] = useState("Basic Info");
  const [isCombination, setIsCombination] = useState(false);
  const [attTitle, setAttTitle] = useState([]);
  const [variantTitle, setVariantTitle] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [productId, setProductId] = useState("");
  const [updatedId, setUpdatedId] = useState(id);
  const [imgId, setImgId] = useState("");
  const [isBulkUpdate, setIsBulkUpdate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [defaultCategory, setDefaultCategory] = useState([]);
  const [resData, setResData] = useState({});
  const [language, setLanguage] = useState("en");
  const [openModal, setOpenModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slug, setSlug] = useState("");

  // This state will hold the array of product units
  const [productUnits, setProductUnits] = useState([]);

  const { handlerTextTranslateHandler } = useTranslationValue();
  const { showingTranslateValue, getNumber, getNumberTwo } = useUtilsFunction();

  // Add a new blank product unit
  const addProductUnit = () => {
    setProductUnits([
      ...productUnits,
      {
        unit: '', // Will be unit ID
        packQty: 1,
        price: 0,
        mrp: 0,
        isDefault: false,
      },
    ]);
  };

  // Update a field in a specific product unit
  const updateProductUnit = (index, field, value) => {
    const newUnits = [...productUnits];
    const unitToUpdate = { ...newUnits[index] };

    // If changing the unit, you might want to reset other fields
    if (field === 'unit') {
      // Logic to pull default values for the new unit if needed
    }

    unitToUpdate[field] = value;
    newUnits[index] = unitToUpdate;
    setProductUnits(newUnits);
  };

  // Remove a product unit from the list
  const removeProductUnit = (index) => {
    const newUnits = [...productUnits];
    newUnits.splice(index, 1);
    setProductUnits(newUnits);
  };

  // === LOAD PRODUCT DATA ON EDIT ===
  useEffect(() => {
    if (id) {
      // Load product data
      const loadProduct = async () => {
        try {
          console.log('Loading product data for ID:', id);
          const result = await ProductServices.getProductById(id);
          console.log('Product loaded:', result);
          
          // Set the product in state
          setResData(result);
          setUpdatedId(id);
          
          // Parse and set product data
          const productData = {
            ...result,
            // Process any specific fields needed
            categories: result.categories || [],
            basicUnit: result.basicUnit || null,
          };
          
          // Set product units if any
          try {
            const unitsResult = await ProductUnitServices.getProductUnits(id);
            console.log('Product units fetched:', unitsResult.data);
            setProductUnits(unitsResult.data || []);
          } catch (unitErr) {
            console.error('Error fetching product units:', unitErr);
            
            // Only extract data from response if it exists
            const errorMessage = unitErr.response && unitErr.response.data 
              ? unitErr.response.data.message || 'Failed to fetch product units'
              : 'Error loading product units';
            
            notifyError(errorMessage);
            setProductUnits([]);
          }
          
          // Set form data
          setValue("title", result.title[lang] || "");
          setValue("description", result.description[lang] || "");
          setValue("basicUnit", result.basicUnit?._id || result.basicUnit);
            
            // Other fields
          setValue("slug", result.slug);
          setValue("price", result.price || 0);
          setValue("stock", result.stock || 0);
          setValue("sku", result.sku || "");
          setValue("barcode", result.barcode || "");
            
            // Set categories
          if (result.categories && result.categories.length > 0) {
            console.log('Setting product categories:', result.categories);
              
              // Format category names if needed
            const formattedCategories = result.categories.map(category => {
                if (typeof category === 'object' && category !== null) {
                  return {
                    ...category,
                    name: showingTranslateValue(category.name, lang)
                  };
                }
                return category;
              });
              
              setSelectedCategory(formattedCategories);
            }
            
            // Set default/primary category
          if (result.category) {
            console.log('Setting default category:', result.category);
              const formattedCategory = {
              ...result.category,
              name: showingTranslateValue(result.category.name, lang)
              };
              
              setDefaultCategory([formattedCategory]);
            }
            
            // Set state values
          setPrice(result.price || 0);
          setQuantity(result.stock || 0);
          setSku(result.sku || "");
          setBarcode(result.barcode || "");
          setImageUrl(result.image || []);
          setTag(result.tags);
          
          return result;
        } catch (err) {
          console.error('Error loading product:', err);
          
          // Only extract data from response if it exists
          const errorMessage = err.response && err.response.data 
            ? err.response.data.message || 'Failed to load product'
            : 'Error loading product data';
          
          notifyError(errorMessage);
          return null;
        }
      };

      loadProduct();
    }
  }, [id, setValue, lang]);

  const handleRemoveEmptyKey = (obj) => {
    Object.keys(obj).forEach(
      (k) => !obj[k] && obj[k] !== undefined && delete obj[k]
    );
    return obj;
  };

  // === UPDATED ONSUBMIT FUNCTION ===
  const onSubmit = async (data) => {
    // Ensure at least one product image is present before submitting
    if (!imageUrl || (Array.isArray(imageUrl) && imageUrl.length === 0)) {
      notifyError('Please upload at least one product image before saving.');
      return;
    }

    try {
      // Build bilingual title and description objects
      const titleObj = {
        en: data.title || '',
        ar: data.titleAr || '',
      };
      const descriptionObj = {
        en: data.description || '',
        ar: data.descriptionAr || '',
      };
      // Remove the flat fields so they don't overwrite the object
      const { title, titleAr, description, descriptionAr, ...restData } = data;
      
      const productData = {
        ...restData,
        title: titleObj,
        description: descriptionObj,
        image: imageUrl,
        ...(defaultCategory && defaultCategory._id && { category: defaultCategory._id }),
      };
      
      console.log('Prepared product data:', JSON.stringify(productData, null, 2));
      
      let result;
      let updatedId;
      
      // Product submission logic
      if (resData) {
        console.log('Updating existing product:', resData._id);
        // Update product data
        result = await ProductServices.updateProduct(resData._id, productData);
        console.log('Product update result:', JSON.stringify(result, null, 2));
        
        updatedId = resData._id;
        notifySuccess('Product updated successfully!');
        
        // Process product units for existing product
        try {
          console.log('Processing product units...', productUnits.length);
          
          if (productUnits.length > 0) {
            console.log('Setting hasMultiUnits to true');
            try {
              await ProductServices.updateProduct(updatedId, { hasMultiUnits: true });
            } catch (flagError) {
              console.error('Error setting hasMultiUnits flag:', flagError);
            }
            
            // For each product unit, create or update it
            for (const unit of productUnits) {
              // Ensure packQty is at least 0.001 as required by the model
              const packQtyValue = parseFloat(unit.packQty) || 1;
              
              const unitData = {
                product: updatedId,  // Field name in the model
                unit: unit.unit,     // Field name in the model
                unitId: unit.unit,   // Include both formats to be safe
                unitValue: 1,        // Default value required by the model
                packQty: packQtyValue < 0.001 ? 0.001 : packQtyValue, // Ensure minimum value
                price: parseFloat(unit.price) || 0,
                sku: unit.sku || "",
                barcode: unit.barcode || "",
                isDefault: unit.isDefault || false,
                title: unit.label || unit.title || `Unit for ${resData?.title?.en || 'Product'}`,
                unitType: 'multi',
                isActive: true,
                isAvailable: true,
                status: "show"
              };

              console.log('Processing unit with data:', JSON.stringify(unitData, null, 2));

              try {
                // If the unit has an ID, update it, otherwise create a new one
                if (unit._id) {
                  console.log('Updating existing unit:', unit._id);
                  await ProductUnitServices.updateProductUnit(updatedId, unit._id, unitData);
                } else {
                  // Always create new units that don't have an _id (this covers all new units)
                  console.log('Creating new unit for existing product');
                  console.log('Unit data being sent to API:', JSON.stringify(unitData, null, 2));
                  
                  try {
                    const unitResult = await ProductUnitServices.createProductUnit(updatedId, unitData);
                    console.log('Unit creation result:', JSON.stringify(unitResult, null, 2));
                  } catch (unitError) {
                    console.error('Detailed unit creation error:', unitError);
                    console.error('Error response data:', unitError.response?.data);
                    console.error('Error response status:', unitError.response?.status);
                    
                    // Handle duplicate unit error specifically
                    if (unitError.response?.status === 409) {
                      const duplicateInfo = unitError.response?.data?.duplicateUnit;
                      notifyError(`Duplicate unit: ${duplicateInfo?.unitName || 'Unknown'} with pack quantity ${duplicateInfo?.packQty} already exists`);
                    } else {
                      notifyError(`Failed to create unit: ${unitError.response?.data?.message || unitError.message}`);
                    }
                    
                    throw unitError;
                  }
                }
              } catch (error) {
                console.error('Error processing unit:', error);
                if (error.response && error.response.data) {
                  console.error('Error details:', JSON.stringify(error.response.data, null, 2));
                }
                // Continue with other units instead of failing the entire process
                notifyError(`Error with unit ${unit.label || 'unnamed'}: ${error.message}`);
              }
            }
            console.log('All product units processed successfully');
          } else {
            console.log('No product units to process');
          }
        } catch (unitError) {
          console.error('Error processing units:', unitError);
          notifyError('Error saving product units: ' + unitError.message);
          // Continue with the rest of the process
        }
      } else {
        console.log('Creating new product');
        // Create a new product
        result = await ProductServices.addProduct(productData);
        console.log('Product creation result:', JSON.stringify(result, null, 2));
        
        const newProductId = result._id;
        updatedId = newProductId;
        
        notifySuccess("Product added successfully");
        
        if (productUnits.length > 0) {
          console.log('Setting hasMultiUnits to true for new product');
          try {
            await ProductServices.updateProduct(newProductId, { hasMultiUnits: true });
          } catch (flagError) {
            console.error('Error setting hasMultiUnits flag for new product:', flagError);
          }
          
          // Add better error handling for unit creation for new products
          try {
            console.log('Processing product units for new product...', productUnits.length);
            
            if (productUnits.length > 0) {
              // Create product units
              for (const unit of productUnits) {
                // Ensure packQty is at least 0.001 as required by the model
                const packQtyValue = parseFloat(unit.packQty) || 1;
                
                const unitData = {
                  product: newProductId,  // Field name in the model
                  unit: unit.unit,        // Field name in the model 
                  unitId: unit.unit,      // Include both formats to be safe
                  unitValue: 1,           // Default value required by the model
                  packQty: packQtyValue < 0.001 ? 0.001 : packQtyValue, // Ensure minimum value
                  price: parseFloat(unit.price) || 0,
                  sku: unit.sku || "",
                  barcode: unit.barcode || "",
                  isDefault: unit.isDefault || false,
                  title: unit.label || unit.title || `Unit for ${result?.title?.en || 'Product'}`,
                  unitType: 'multi',
                  isActive: true,
                  isAvailable: true,
                  status: "show"
                };
                
                try {
                  console.log('Creating unit for new product:', JSON.stringify(unitData, null, 2));
                  
                  try {
                    const unitResult = await ProductUnitServices.createProductUnit(newProductId, unitData);
                    console.log('New product unit creation result:', JSON.stringify(unitResult, null, 2));
                  } catch (unitError) {
                    console.error('Detailed unit creation error for new product:', unitError);
                    console.error('Error response data:', unitError.response?.data);
                    console.error('Error response status:', unitError.response?.status);
                    
                    // Handle duplicate unit error specifically
                    if (unitError.response?.status === 409) {
                      const duplicateInfo = unitError.response?.data?.duplicateUnit;
                      notifyError(`Duplicate unit: ${duplicateInfo?.unitName || 'Unknown'} with pack quantity ${duplicateInfo?.packQty} already exists`);
                    } else {
                      notifyError(`Failed to create unit: ${unitError.response?.data?.message || unitError.message}`);
                    }
                    
                    throw unitError;
                  }
                } catch (error) {
                  console.error('Error creating unit for new product:', error);
                  if (error.response && error.response.data) {
                    console.error('Error details:', error.response.data);
                  }
                  // Continue with other units instead of failing the entire process
                  notifyError(`Error with unit ${unit.label || 'unnamed'}: ${error.message}`);
                }
              }
              console.log('All product units for new product created successfully');
            } else {
              console.log('No product units to create for new product');
            }
          } catch (unitError) {
            console.error('Error processing units for new product:', unitError);
            notifyError('Error creating product units: ' + unitError.message);
            // Continue with the rest of the process
          }
        }
      }
      
      setIsUpdate(true);
      closeDrawer();
      setIsSubmitting(false);
    } catch (err) {
      console.error('Error in form submission:', err);
      setIsSubmitting(false);
      notifyError(err ? (err.response?.data?.message || err.message) : "An error occurred");
    }
  };

  const handleAddAtt = (v, el) => {
    const result = attribue.filter((att) => {
      const attribueTItle = showingTranslateValue(att?.title, lang);
      return v.some((item) => item.label === attribueTItle);
    });

    const attributeArray = result.map((value) => {
      const attributeTitle = showingTranslateValue(value?.title, lang);
      return {
        ...value,
        label: attributeTitle,
        value: attributeTitle,
      };
    });

    setAttributes(attributeArray);
  };

  const handleGenerateCombination = () => {
    if (Object.keys(values).length === 0) {
      return notifyError("Please select a variant first!");
    }

    const result = variants.filter(
      ({
        originalPrice,
        discount,
        price,
        quantity,
        barcode,
        sku,
        productId,
        image,
        ...rest
      }) => JSON.stringify({ ...rest }) !== "{}"
    );

    setVariants(result);

    const combo = combinate(values);

    combo.map((com, i) => {
      if (JSON.stringify(variant).includes(JSON.stringify(com))) {
        return setVariant((pre) => [...pre, com]);
      } else {
        const newCom = {
          ...com,

          originalPrice: getNumberTwo(originalPrice),
          price: getNumber(price),
          quantity: Number(quantity),
          discount: Number(originalPrice - price),
          productId: productId && productId + "-" + (variants.length + i),
          barcode: barcode,
          sku: sku,
          image: imageUrl[0] || "",
        };

        setVariants((pre) => [...pre, newCom]);
        return setVariant((pre) => [...pre, com]);
      }
    });

    setValues({});
  };

  const handleClearVariant = () => {
    setVariants([]);
    setVariant([]);
    setValues({});
    resetRef?.current?.map(
      async (v, i) => await resetRef?.current[i]?.resetSelectedValues()
    );
  };

  const handleEditVariant = (variant) => {
    setTapValue("Combine");
  };

  const handleRemoveVariant = (vari, ext) => {
    swal({
      title: `Are you sure to delete this ${ext ? "Extra" : "combination"}!`,
      text: `(If Okay, It will be delete this ${
        ext ? "Extra" : "combination"
      })`,
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        const result = variants.filter((v) => v !== vari);
        setVariants(result);
        const {
          originalPrice,
          price,
          discount,
          quantity,
          barcode,
          sku,
          productId,
          image,
          ...rest
        } = vari;
        const res = variant.filter(
          (obj) => JSON.stringify(obj) !== JSON.stringify(rest)
        );
        setVariant(res);
        setIsBulkUpdate(true);
        const timeOutId = setTimeout(() => setIsBulkUpdate(false), 500);
        return clearTimeout(timeOutId);
      }
    });
  };

  const handleIsCombination = () => {
    if ((isCombination && variantTitle.length) > 0) {
      swal({
        title: "Are you sure to remove combination from this product!",
        text: "(It will be delete all your combination and extras)",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((value) => {
        if (value) {
          setIsCombination(!isCombination);
          setTapValue("Basic Info");
          setVariants([]);
          setVariant([]);
        }
      });
    } else {
      setIsCombination(!isCombination);
      setTapValue("Basic Info");
    }
  };

  const handleSelectImage = (img) => {
    if (openModal) {
      variants[imgId].image = img;
      setOpenModal(false);
    }
  };

  const handleSelectInlineImage = (id) => {
    setImgId(id);
    setOpenModal(!openModal);
  };

  const handleSkuBarcode = (value, name, id) => {
    variants[id][name] = value;
  };

  const handleProductTap = (e, value, name) => {
    if (value) {
      if (!value)
        return notifyError(
          `${"Please save product before adding combinations!"}`
        );
    } else {
      if (!isBasicComplete)
        return notifyError(
          `${"Please save product before adding combinations!"}`
        );
    }
    setTapValue(e);
  };

  const handleQuantityPrice = (value, name, id, variant) => {
    setVariants((pre) =>
      pre.map((com, i) => {
        if (i === id) {
          const updatedCom = {
            ...com,
            [name]: Math.round(value),
          };

          if (name === "price") {
            updatedCom.price = getNumberTwo(value);
          }

          return updatedCom;
        }
        return com;
      })
    );

    const totalStock = variants.reduce(
      (pre, acc) => Number(pre) + Number(acc.quantity),
      0
    );
    setTotalStock(Number(totalStock));
  };

  const handleSelectLanguage = (lang) => {
    setLanguage(lang);
    if (Object.keys(resData).length > 0) {
      setValue("title", resData.title[lang ? lang : "en"]);
      setValue("description", resData.description[lang ? lang : "en"]);
    }
  };

  const handleProductSlug = (value) => {
    setValue("slug", value.toLowerCase().replace(/[^A-Z0-9]+/gi, "-"));
    setSlug(value.toLowerCase().replace(/[^A-Z0-9]+/gi, "-"));
  };

  // Updated method for handling product units
  const handleAddUnit = (unit) => {
    try {
      console.log('🔧 handleAddUnit called with:', JSON.stringify(unit, null, 2));
      
      // Ensure we always have a unitValue field (required by the model)
      if (!unit.unitValue) {
        unit.unitValue = 1;
      }
      
      // Ensure packQty meets minimum requirements
      if (!unit.packQty || parseFloat(unit.packQty) < 0.001) {
        unit.packQty = 0.001;
      } else {
        unit.packQty = parseFloat(unit.packQty);
      }
      
      // Update units with functional state update
      setProductUnits(prevUnits => {
        // Create a deep copy of the previous units array
        const updatedUnits = [...prevUnits];
        
        // Add the new unit
        updatedUnits.push(unit);
        
        console.log('📦 Product units BEFORE adding:', prevUnits.length);
        console.log('📦 Product units AFTER adding:', updatedUnits.length);
        console.log('📦 New unit added:', JSON.stringify(unit, null, 2));
        console.log('📦 Complete updated units array:', JSON.stringify(updatedUnits, null, 2));
        
        return updatedUnits;
      });
      
      console.log('✅ Unit added successfully to productUnits state');
    } catch (error) {
      console.error('❌ Error adding unit:', error);
      notifyError('Failed to add unit: ' + error.message);
    }
  };

  const handleEditUnit = (index, unitData) => {
    const updatedUnits = [...productUnits];
    
    // Ensure packQty is at least 0.001 as required by the model
    if (unitData.packQty) {
      const packQtyValue = parseFloat(unitData.packQty);
      unitData.packQty = packQtyValue < 0.001 ? 0.001 : packQtyValue;
    }
    
    updatedUnits[index] = {
      ...updatedUnits[index],
      ...unitData,
    };
    
    setProductUnits(updatedUnits);
  };

  // Remove a unit from the product
  const handleRemoveUnit = (unitIdOrIndex) => {
    try {
      console.log('Removing unit:', unitIdOrIndex);
      
      setProductUnits(prevUnits => {
        // If unitIdOrIndex is a number, treat it as an index
        if (typeof unitIdOrIndex === 'number') {
          if (unitIdOrIndex < 0 || unitIdOrIndex >= prevUnits.length) {
            console.error(`Invalid index: ${unitIdOrIndex}. Units length: ${prevUnits.length}`);
            return prevUnits;
          }
          
          // Create a new array without the unit at the specified index
          const updatedUnits = [
            ...prevUnits.slice(0, unitIdOrIndex),
            ...prevUnits.slice(unitIdOrIndex + 1)
          ];
          
          console.log('Units after removal by index:', updatedUnits);
          return updatedUnits;
        } 
        // Otherwise treat it as an ID
        else {
          // Find the unit with the matching ID
          const unitIndex = prevUnits.findIndex(u => 
            u._id === unitIdOrIndex || u.id === unitIdOrIndex
          );
          
          if (unitIndex === -1) {
            console.error(`Unit with ID ${unitIdOrIndex} not found`);
            return prevUnits;
          }
          
          // Create a new array without the unit with the matching ID
          const updatedUnits = [
            ...prevUnits.slice(0, unitIndex),
            ...prevUnits.slice(unitIndex + 1)
          ];
          
          console.log('Units after removal by ID:', updatedUnits);
          return updatedUnits;
        }
      });
    } catch (error) {
      console.error('Error removing unit:', error);
      notifyError('Failed to remove unit: ' + error.message);
    }
  };

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    imageUrl,
    setImageUrl,
    tag,
    setTag,
    handleIsCombination,
    values,
    variants,
    attTitle,
    handleAddAtt,
    handleClearVariant,
    handleEditVariant,
    handleRemoveVariant,
    handleGenerateCombination,
    isCombination,
    handleProductTap,
    tapValue,
    quantity,
    setQuantity,
    totalStock,
    price,
    originalPrice,
    setPrice,
    setOriginalPrice,
    sku,
    setSku,
    barcode,
    setBarcode,
    handleQuantityPrice,
    handleSkuBarcode,
    selectedCategory,
    setSelectedCategory,
    defaultCategory,
    setDefaultCategory,
    handleSelectLanguage,
    handleSelectImage,
    handleSelectInlineImage,
    updatedId,
    language,
    openModal,
    setOpenModal,
    onCloseModal,
    isSubmitting,
    productId,
    setValue,
    attribue,
    handleProductSlug,
    slug,
    watch,
    reset,
    handleRemoveEmptyKey,
    control,
    // Added new values for multi-unit functionality
    productUnits,
    setProductUnits,
    handleAddUnit,
    handleEditUnit,
    handleRemoveUnit
  };
};

export default useProductSubmit;
