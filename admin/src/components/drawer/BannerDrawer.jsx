import React, { useContext, useEffect, useState } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import { Input, Button, Textarea, Select } from "@windmill/react-ui";
import { useForm } from 'react-hook-form';
import { FiUploadCloud, FiX, FiCalendar, FiLink, FiImage } from "react-icons/fi";
import { useQueryClient } from "@tanstack/react-query";

// Internal imports
import Title from "@/components/form/others/Title";
import LabelArea from "@/components/form/selectOption/LabelArea";
import Error from "@/components/form/others/Error";
import InputArea from "@/components/form/input/InputArea";
import DrawerButton from "@/components/form/button/DrawerButton";
import UploaderWithCropper from "@/components/image-uploader/UploaderWithCropper";
import { SidebarContext } from "@/context/SidebarContext";
import BannerServices from "@/services/BannerServices";
import { notifyError, notifySuccess } from "@/utils/toast";

// Helper function to extract multilingual content safely
const extractMultilingualContent = (field, defaultValue = '') => {
  if (!field) return { en: defaultValue, ar: defaultValue };
  
  // If it's already an object with en/ar keys
  if (typeof field === 'object' && field !== null) {
    return {
      en: field.en || defaultValue,
      ar: field.ar || defaultValue
    };
  }
  
  // If it's a string, treat as English content
  if (typeof field === 'string') {
    return { en: field, ar: defaultValue };
  }
  
  // Fallback
  return { en: defaultValue, ar: defaultValue };
};

// Banner location configurations with dimensions
const BANNER_LOCATIONS = {
  'home-hero': {
    name: 'Home Page Hero Carousel',
    maxBanners: 10,
    dimensions: { width: 1920, height: 400 },
    description: 'Main carousel banners on homepage - supports both single and triple image layouts'
  },
  'home-middle': {
    name: 'Home Page Middle Banner',
    maxBanners: 1,
    dimensions: { width: 1200, height: 300 },
    description: 'Promotional banner in middle of homepage'
  },
  'products-hero': {
    name: 'Products Page Hero',
    maxBanners: 3,
    dimensions: { width: 1920, height: 300 },
    description: 'Hero banner carousel for products page'
  },
  'category-top': {
    name: 'Category Section Top',
    maxBanners: 1,
    dimensions: { width: 1200, height: 200 },
    description: 'Banner above category section'
  },
  'promotions-hero': {
    name: 'Promotions Page Hero',
    maxBanners: 2,
    dimensions: { width: 1920, height: 350 },
    description: 'Hero banners for promotions page'
  },
  'page-header': {
    name: 'Page Headers',
    maxBanners: 10,
    dimensions: { width: 1920, height: 250 },
    description: 'Background banners for page headers'
  },
  'sidebar-ads': {
    name: 'Sidebar Advertisements',
    maxBanners: 5,
    dimensions: { width: 300, height: 400 },
    description: 'Sidebar advertisement banners'
  },
  'footer-banner': {
    name: 'Footer Banner',
    maxBanners: 1,
    dimensions: { width: 1200, height: 150 },
    description: 'Banner above footer section'
  }
};

const BannerDrawer = ({ id }) => {
  const { isDrawerOpen, closeDrawer } = useContext(SidebarContext);
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = useState([]);
  const [leftImageUrl, setLeftImageUrl] = useState("");
  const [rightImageUrl, setRightImageUrl] = useState("");
  const [leftImageUrl1, setLeftImageUrl1] = useState("");
  const [leftImageUrl2, setLeftImageUrl2] = useState("");
  const [rightImageUrl1, setRightImageUrl1] = useState("");
  const [rightImageUrl2, setRightImageUrl2] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('home-hero');
  const [layoutType, setLayoutType] = useState('single');

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
    reset,
    watch
  } = useForm();

  const watchedLocation = watch('location');
  const watchedLayoutType = watch('layoutType');

  // Update selected location when form value changes
  useEffect(() => {
    if (watchedLocation) {
      setSelectedLocation(watchedLocation);
    }
  }, [watchedLocation]);

  // Update layout type when form value changes
  useEffect(() => {
    if (watchedLayoutType) {
      setLayoutType(watchedLayoutType);
    }
  }, [watchedLayoutType]);

  // Fetch banner data when editing
  useEffect(() => {
    if (id) {
      console.log('Loading banner with ID:', id);
      setLoading(true);
      BannerServices.getBannerById(id)
        .then((response) => {
          console.log('Raw banner response:', response);
          
          // Handle different possible response structures
          let banner = null;
          
          // Direct banner object
          if (response && response.title) {
            banner = response;
            console.log('Using direct banner object');
          }
          // Wrapped in data property
          else if (response && response.data && response.data.title) {
            banner = response.data;
            console.log('Using response.data');
          }
          // Axios response structure
          else if (response && response.data && response.data.data && response.data.data.title) {
            banner = response.data.data;
            console.log('Using response.data.data');
          }
          
          if (banner && banner.title) {
            // Handle multilingual content using the helper function
            const titleObj = extractMultilingualContent(banner.title);
            const descriptionObj = extractMultilingualContent(banner.description);
            const linkTextObj = extractMultilingualContent(banner.linkText);
            
            setValue('title', titleObj.en);
            setValue('titleAr', titleObj.ar);
            setValue('description', descriptionObj.en);
            setValue('descriptionAr', descriptionObj.ar);
            setValue('location', banner.location || 'home-hero');
            setValue('linkUrl', banner.linkUrl || '');
            setValue('linkText', linkTextObj.en);
            setValue('linkTextAr', linkTextObj.ar);
            setValue('status', banner.status || 'active');
            setValue('sortOrder', banner.sortOrder || 0);
            setValue('startDate', banner.startDate ? banner.startDate.split('T')[0] : '');
            setValue('endDate', banner.endDate ? banner.endDate.split('T')[0] : '');
            setValue('openInNewTab', banner.openInNewTab || false);
            setValue('layoutType', banner.layoutType || 'single');
            setValue('leftImageAnimation', banner.leftImageAnimation || 'slideUp');
            setValue('rightImageAnimation', banner.rightImageAnimation || 'slideUp');
            setValue('centerImageAnimation', banner.centerImageAnimation || 'slideRight');
            
            setImageUrl(Array.isArray(banner.imageUrl) ? banner.imageUrl : (banner.imageUrl ? [banner.imageUrl] : [])); // Ensure it's always an array
            setLeftImageUrl(banner.leftImageUrl || '');
            setRightImageUrl(banner.rightImageUrl || '');
            setLeftImageUrl1(banner.leftImageUrl1 || '');
            setLeftImageUrl2(banner.leftImageUrl2 || '');
            setRightImageUrl1(banner.rightImageUrl1 || '');
            setRightImageUrl2(banner.rightImageUrl2 || '');
            setSelectedLocation(banner.location || 'home-hero');
            setLayoutType(banner.layoutType || 'single');
            
            console.log('Banner data loaded successfully:', {
              title: titleObj,
              description: descriptionObj,
              linkText: linkTextObj,
              location: banner.location,
              layoutType: banner.layoutType,
              imageUrl: banner.imageUrl
            });
            
            // Force form re-render to ensure values are displayed
            setTimeout(() => {
              console.log('Form values after setValue:', {
                title: titleObj.en,
                titleAr: titleObj.ar,
                description: descriptionObj.en,
                descriptionAr: descriptionObj.ar,
                linkText: linkTextObj.en,
                linkTextAr: linkTextObj.ar
              });
            }, 100);
          } else {
            console.error('No valid banner data found in response:', response);
            notifyError('Failed to load banner data - invalid response structure');
          }
        })
        .catch((error) => {
          console.error('Error fetching banner:', error);
          notifyError(error?.response?.data?.message || error?.message || 'Error loading banner');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, setValue]);

  // Reset form when drawer closes
  useEffect(() => {
    if (!isDrawerOpen) {
      console.log('Drawer closed, resetting form');
      reset();
      setImageUrl([]);
      setLeftImageUrl('');
      setRightImageUrl('');
      setLeftImageUrl1('');
      setLeftImageUrl2('');
      setRightImageUrl1('');
      setRightImageUrl2('');
      setSelectedLocation('home-hero');
      setLayoutType('single');
      clearErrors();
    }
  }, [isDrawerOpen, reset, clearErrors]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Validate image upload based on layout type
      if (!imageUrl || imageUrl.length === 0) {
        notifyError('Please upload a center/main banner image');
        return;
      }

      if (data.layoutType === 'triple') {
        if (!leftImageUrl1 && !leftImageUrl) {
          notifyError('Please upload at least one left side image for triple layout');
          return;
        }
        if (!rightImageUrl1 && !rightImageUrl) {
          notifyError('Please upload at least one right side image for triple layout');
          return;
        }
      }

      // Prepare multilingual fields
      const titleObj = {
        en: data.title || '',
        ar: data.titleAr || '',
      };
      const descriptionObj = {
        en: data.description || '',
        ar: data.descriptionAr || '',
      };
      const linkTextObj = {
        en: data.linkText || '',
        ar: data.linkTextAr || '',
      };
      // Remove flat fields so they don't overwrite the object
      const { title, titleAr, description, descriptionAr, linkText, linkTextAr, ...restData } = data;

      // Prepare banner data
      const bannerData = {
        ...restData,
        title: titleObj,
        description: descriptionObj,
        linkText: linkTextObj,
        imageUrl: imageUrl[0] || '',
        leftImageUrl: data.layoutType === 'triple' ? leftImageUrl : null,
        rightImageUrl: data.layoutType === 'triple' ? rightImageUrl : null,
        leftImageUrl1: data.layoutType === 'triple' ? leftImageUrl1 : null,
        leftImageUrl2: data.layoutType === 'triple' ? leftImageUrl2 : null,
        rightImageUrl1: data.layoutType === 'triple' ? rightImageUrl1 : null,
        rightImageUrl2: data.layoutType === 'triple' ? rightImageUrl2 : null,
        sortOrder: parseInt(data.sortOrder) || 0,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        openInNewTab: data.openInNewTab || false
      };

      let response;
      if (id) {
        response = await BannerServices.updateBanner(id, bannerData);
        notifySuccess('Banner updated successfully!');
      } else {
        response = await BannerServices.addBanner(bannerData);
        notifySuccess('Banner created successfully!');
      }

      // Invalidate and refetch banner queries
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      queryClient.invalidateQueries({ queryKey: ['home-hero-banners'] });
      queryClient.invalidateQueries({ queryKey: ['home-middle-banner'] });

      reset();
      setImageUrl([]);
      setLeftImageUrl('');
      setRightImageUrl('');
      setLeftImageUrl1('');
      setLeftImageUrl2('');
      setRightImageUrl1('');
      setRightImageUrl2('');
      setSelectedLocation('home-hero');
      setLayoutType('single');
      closeDrawer();
    } catch (error) {
      notifyError(error?.response?.data?.message || 'Error saving banner');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDimensions = () => {
    return BANNER_LOCATIONS[selectedLocation]?.dimensions || { width: 1920, height: 400 };
  };

  return (
    <div className="w-full relative">
      <div className="flex flex-col justify-between h-full">
        <div className="w-full relative">
          <Scrollbars
            className="w-full md:w-7/12 lg:w-6/12 xl:w-4/12 relative dark:bg-gray-700 dark:text-gray-200"
            style={{ height: "100vh" }}
            renderThumbHorizontal={(props) => (
              <div {...props} style={{ display: "none" }} />
            )}
          >
            <div className="w-full relative">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
                <Title
                  title={id ? "Update Banner" : "Add Banner"}
                  description={id ? "Update banner details and configuration" : "Add a new banner with image and settings"}
                />
                <button
                  onClick={closeDrawer}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Layout Type Selection - Only for home-hero */}
                {selectedLocation === 'home-hero' && (
                  <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <LabelArea label="Banner Layout Type" />
                    <Select
                      className="border h-12 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                      {...register("layoutType", { required: "Layout type is required!" })}
                    >
                      <option value="single">Single Image (Classic)</option>
                      <option value="triple">Multi-Image Layout (2x2 Sides + Center 60%)</option>
                    </Select>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      {layoutType === 'triple' 
                        ? 'Multi-image layout shows up to 5 images (2x2 sides + center) with text only on center image'
                        : 'Single layout shows one image at a time with text overlay'
                      }
                    </p>
                    <Error errorName={errors.layoutType} />
                  </div>
                )}

                {/* Image Upload Section */}
                <div className="mb-6">
                  <LabelArea label={layoutType === 'triple' ? "Center Image (Main Content)" : "Banner Image"} />
                  <div className="mt-2">
                    {/* Dimension Info */}
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                          Recommended Size: {getCurrentDimensions().width} × {getCurrentDimensions().height}px
                        </span>
                        <FiImage className="text-blue-500" />
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {BANNER_LOCATIONS[selectedLocation]?.description}
                        {layoutType === 'triple' && ' - Text content will only show on this center image'}
                      </p>
                    </div>
                    
                    <UploaderWithCropper
                      imageUrl={imageUrl}
                      setImageUrl={setImageUrl}
                      context="banner"
                      location={selectedLocation}
                      layoutType={layoutType}
                      folder="banners"
                      title="Upload Banner Image"
                      product={true} // Enable multi-image upload for center banner
                      enableCropper={false} // Disable cropper for banner uploads
                    />
                  </div>
                </div>

                {/* Triple Layout Additional Images - 2x2 Layout */}
                {layoutType === 'triple' && selectedLocation === 'home-hero' && (
                  <div className="mb-6 space-y-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h3 className="text-lg font-medium text-purple-800 dark:text-purple-200 mb-4">
                      Side Images (2x2 Layout - 4 Images Total)
                    </h3>
                    
                    {/* Left Side Images (2 images stacked) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-md font-medium text-purple-700 dark:text-purple-300">Left Side (15% width)</h4>
                        
                        {/* Left Image 1 */}
                        <div>
                          <LabelArea label="Left Top Image" />
                          <div className="mt-2">
                            <div className="mb-3 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-purple-700 dark:text-purple-300">
                                  Recommended: Square/Portrait (e.g., 400×300px)
                                </span>
                                <FiImage className="text-purple-500" />
                              </div>
                            </div>
                            
                            <UploaderWithCropper
                              imageUrl={leftImageUrl1}
                              setImageUrl={setLeftImageUrl1}
                              context="banner-side"
                              folder="banners/sides"
                              title="Upload Left Top Image"
                              enableCropper={false} // Disable cropper for side banner uploads
                            />
                          </div>
                        </div>

                        {/* Left Image 2 */}
                        <div>
                          <LabelArea label="Left Bottom Image" />
                          <div className="mt-2">
                            <div className="mb-3 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-purple-700 dark:text-purple-300">
                                  Recommended: Square/Portrait (e.g., 400×300px)
                                </span>
                                <FiImage className="text-purple-500" />
                              </div>
                            </div>
                            
                            <UploaderWithCropper
                              imageUrl={leftImageUrl2}
                              setImageUrl={setLeftImageUrl2}
                              context="banner-side"
                              folder="banners/sides"
                              title="Upload Left Bottom Image"
                              enableCropper={false} // Disable cropper for side banner uploads
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Side Images (2 images stacked) */}
                      <div className="space-y-4">
                        <h4 className="text-md font-medium text-purple-700 dark:text-purple-300">Right Side (15% width)</h4>
                        
                        {/* Right Image 1 */}
                        <div>
                          <LabelArea label="Right Top Image" />
                          <div className="mt-2">
                            <div className="mb-3 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-purple-700 dark:text-purple-300">
                                  Recommended: Square/Portrait (e.g., 400×300px)
                                </span>
                                <FiImage className="text-purple-500" />
                              </div>
                            </div>
                            
                            <UploaderWithCropper
                              imageUrl={rightImageUrl1}
                              setImageUrl={setRightImageUrl1}
                              context="banner-side"
                              folder="banners/sides"
                              title="Upload Right Top Image"
                              enableCropper={false} // Disable cropper for side banner uploads
                            />
                          </div>
                        </div>

                        {/* Right Image 2 */}
                        <div>
                          <LabelArea label="Right Bottom Image" />
                          <div className="mt-2">
                            <div className="mb-3 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-purple-700 dark:text-purple-300">
                                  Recommended: Square/Portrait (e.g., 400×300px)
                                </span>
                                <FiImage className="text-purple-500" />
                              </div>
                            </div>
                            
                            <UploaderWithCropper
                              imageUrl={rightImageUrl2}
                              setImageUrl={setRightImageUrl2}
                              context="banner-side"
                              folder="banners/sides"
                              title="Upload Right Bottom Image"
                              enableCropper={false} // Disable cropper for side banner uploads
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Animation Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <LabelArea label="Left Animation" />
                        <Select
                          className="border h-12 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                          {...register("leftImageAnimation")}
                        >
                          <option value="slideUp">Slide Up</option>
                          <option value="fadeIn">Fade In</option>
                          <option value="slideDown">Slide Down</option>
                        </Select>
                      </div>

                      <div>
                        <LabelArea label="Center Animation" />
                        <Select
                          className="border h-12 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                          {...register("centerImageAnimation")}
                        >
                          <option value="slideRight">Slide Right</option>
                          <option value="slideLeft">Slide Left</option>
                          <option value="fadeIn">Fade In</option>
                        </Select>
                      </div>

                      <div>
                        <LabelArea label="Right Animation" />
                        <Select
                          className="border h-12 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                          {...register("rightImageAnimation")}
                        >
                          <option value="slideUp">Slide Up</option>
                          <option value="fadeIn">Fade In</option>
                          <option value="slideDown">Slide Down</option>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Banner Location */}
                <div>
                  <LabelArea label="Banner Location" />
                  <Select
                    className="border h-12 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                    {...register("location", { required: "Banner location is required!" })}
                  >
                    {Object.entries(BANNER_LOCATIONS).map(([key, location]) => (
                      <option key={key} value={key}>
                        {location.name} ({location.dimensions.width}×{location.dimensions.height})
                      </option>
                    ))}
                  </Select>
                  <Error errorName={errors.location} />
                </div>

                {/* Banner Title */}
                <div>
                  <LabelArea label="Banner Title (English)" />
                  <InputArea
                    register={register}
                    label="Title"
                    name="title"
                    type="text"
                    placeholder="Enter banner title"
                    error={errors.title}
                  />
                  <Error errorName={errors.title} />
                </div>

                {/* Banner Title Arabic */}
                <div>
                  <LabelArea label="Banner Title (Arabic)" />
                  <InputArea
                    register={register}
                    label="Title Arabic"
                    name="titleAr"
                    type="text"
                    placeholder="أدخل عنوان البانر"
                    error={errors.titleAr}
                  />
                </div>

                {/* Description */}
                <div>
                  <LabelArea label="Description (English)" />
                  <Textarea
                    className="border text-sm focus:outline-none block w-full bg-gray-100 border-transparent focus:bg-white"
                    {...register("description")}
                    placeholder="Enter banner description"
                    rows={3}
                  />
                </div>

                {/* Description Arabic */}
                <div>
                  <LabelArea label="Description (Arabic)" />
                  <Textarea
                    className="border text-sm focus:outline-none block w-full bg-gray-100 border-transparent focus:bg-white"
                    {...register("descriptionAr")}
                    placeholder="أدخل وصف البانر"
                    rows={3}
                  />
                </div>

                {/* Link Configuration */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <FiLink className="mr-2" />
                    Link Configuration
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Link URL */}
                    <div>
                      <LabelArea label="Link URL" />
                      <InputArea
                        register={register}
                        label="Link URL"
                        name="linkUrl"
                        type="url"
                        placeholder="https://example.com or /products"
                        error={errors.linkUrl}
                      />
                    </div>

                    {/* Link Text */}
                    <div>
                      <LabelArea label="Link Text (English)" />
                      <InputArea
                        register={register}
                        label="Link Text"
                        name="linkText"
                        type="text"
                        placeholder="Shop Now, Learn More, etc."
                        error={errors.linkText}
                      />
                    </div>

                    {/* Link Text Arabic */}
                    <div>
                      <LabelArea label="Link Text (Arabic)" />
                      <InputArea
                        register={register}
                        label="Link Text Arabic"
                        name="linkTextAr"
                        type="text"
                        placeholder="تسوق الآن، اعرف المزيد، إلخ"
                        error={errors.linkTextAr}
                      />
                    </div>

                    {/* Open in New Tab */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register("openInNewTab")}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Open link in new tab
                      </label>
                    </div>
                  </div>
                </div>

                {/* Status and Scheduling */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <FiCalendar className="mr-2" />
                    Status & Scheduling
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status */}
                    <div>
                      <LabelArea label="Status" />
                      <Select
                        className="border h-12 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
                        {...register("status", { required: "Status is required!" })}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="scheduled">Scheduled</option>
                      </Select>
                      <Error errorName={errors.status} />
                    </div>

                    {/* Sort Order */}
                    <div>
                      <LabelArea label="Sort Order" />
                      <InputArea
                        register={register}
                        label="Sort Order"
                        name="sortOrder"
                        type="number"
                        placeholder="0"
                        error={errors.sortOrder}
                      />
                    </div>

                    {/* Start Date */}
                    <div>
                      <LabelArea label="Start Date (Optional)" />
                      <InputArea
                        register={register}
                        label="Start Date"
                        name="startDate"
                        type="date"
                        error={errors.startDate}
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <LabelArea label="End Date (Optional)" />
                      <InputArea
                        register={register}
                        label="End Date"
                        name="endDate"
                        type="date"
                        error={errors.endDate}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </Scrollbars>
        </div>

        {/* Footer Buttons */}
        <div className="w-full absolute bottom-0 right-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between p-6">
            <div className="flex-grow-0">
              <Button
                onClick={closeDrawer}
                className="h-12 bg-white text-gray-500 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300"
                layout="outline"
              >
                Cancel
              </Button>
            </div>
            <div className="flex-grow-0">
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {id ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  id ? 'Update Banner' : 'Create Banner'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerDrawer;