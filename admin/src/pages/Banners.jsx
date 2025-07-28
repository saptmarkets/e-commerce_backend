import React, { useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiPlus, FiEdit, FiTrash2, FiImage, FiMonitor, FiSmartphone } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

//internal import
import useToggleDrawer from "@/hooks/useToggleDrawer";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { SidebarContext } from "@/context/SidebarContext";
import MainDrawer from "@/components/drawer/MainDrawer";
import CheckBox from "@/components/form/others/CheckBox";
import DeleteModal from "@/components/modal/DeleteModal";
import BulkActionDrawer from "@/components/drawer/BulkActionDrawer";
import TableLoading from "@/components/preloader/TableLoading";
import AnimatedContent from "@/components/common/AnimatedContent";
import BannerDrawer from "@/components/drawer/BannerDrawer";
import BannerServices from "@/services/BannerServices";
import { 
  SimpleTable, 
  SimpleTableHeader, 
  SimpleTableCell, 
  SimpleTableFooter, 
  SimpleTableContainer,
  SimpleTableRow,
  SimpleTableHeaderCell,
  SimpleTableBody,
  SimplePagination
} from "@/components/table/SimpleTable";

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

const Banners = () => {
  const { title, allId, serviceId, handleDeleteMany, handleUpdateMany, handleUpdate } =
    useToggleDrawer();

  const { t } = useTranslation();
  const {
    toggleDrawer,
    lang,
    currentPage,
    handleChangePage,
    searchText,
    searchRef,
    handleSubmitForAll,
    sortedField,
    setSortedField,
    limitData,
  } = useContext(SidebarContext);

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['banners', currentPage, limitData, searchText, sortedField],
    queryFn: () => BannerServices.getAllBanners({
      page: currentPage,
      limit: limitData,
      title: searchText,
      sort: sortedField,
    }),
    staleTime: 30 * 1000, // 30 seconds
  });

  // react hooks
  const [isCheckAll, setIsCheckAll] = useState(false);
  const [isCheck, setIsCheck] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');

  const handleSelectAll = () => {
    setIsCheckAll(!isCheckAll);
    setIsCheck(data?.banners?.map((li) => li._id) || []);
    if (isCheckAll) {
      setIsCheck([]);
    }
  };

  // Filter banners by location
  const filteredBanners = selectedLocation === 'all' 
    ? data?.banners || []
    : data?.banners?.filter(banner => banner.location === selectedLocation) || [];

  const getBannerLocationInfo = (location) => {
    return BANNER_LOCATIONS[location] || { 
      name: location, 
      dimensions: { width: 'Auto', height: 'Auto' },
      description: 'Custom banner location'
    };
  };

  // Helper function to safely extract text from object or string
  const getLocalizedText = (field, fallback = '') => {
    if (!field) return fallback;
    
    // If it's an object with en/ar keys
    if (typeof field === 'object' && field !== null) {
      // Handle nested structure: {en: {en: "...", ar: "..."}, ar: "..."}
      if (lang === 'ar') {
        if (field.ar) {
          // If ar is a string, return it
          if (typeof field.ar === 'string') return field.ar;
          // If ar is an object, try to get the ar value from it
          if (typeof field.ar === 'object' && field.ar.ar) return field.ar.ar;
        }
        // Fallback to en.ar if ar is not available
        if (field.en && typeof field.en === 'object' && field.en.ar) return field.en.ar;
      }
      
      if (lang === 'en') {
        if (field.en) {
          // If en is a string, return it
          if (typeof field.en === 'string') return field.en;
          // If en is an object, try to get the en value from it
          if (typeof field.en === 'object' && field.en.en) return field.en.en;
        }
        // Fallback to ar.en if en is not available
        if (field.ar && typeof field.ar === 'object' && field.ar.en) return field.ar.en;
      }
      
      // Final fallbacks
      if (field.ar && typeof field.ar === 'string') return field.ar;
      if (field.en && typeof field.en === 'string') return field.en;
      if (field.ar && typeof field.ar === 'object' && field.ar.ar) return field.ar.ar;
      if (field.en && typeof field.en === 'object' && field.en.en) return field.en.en;
    }
    
    // If it's already a string, return as is
    return field;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Scheduled' }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <>
      <PageTitle>{t("Banner Management")}</PageTitle>
      <DeleteModal ids={allId} setIsCheck={setIsCheck} title={title} />
      <BulkActionDrawer ids={allId} title="Banners" />
      <MainDrawer>
        <BannerDrawer id={serviceId} />
      </MainDrawer>

      <AnimatedContent>
        {/* Banner Locations Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Object.entries(BANNER_LOCATIONS).map(([key, location]) => (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <FiImage className="text-blue-500 text-xl" />
                <span className="text-xs text-gray-500">
                  {location.dimensions.width}×{location.dimensions.height}
                </span>
              </div>
              <h3 className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1">
                {location.name}
              </h3>
              <p className="text-xs text-gray-500 mb-2">{location.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Max: {location.maxBanners}
                </span>
                <span className="text-xs font-medium text-blue-600">
                  {filteredBanners.filter(banner => banner.location === key).length} Active
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5 rounded-lg">
          <div className="p-4">
            <div className="py-3 grid gap-4 lg:gap-6 xl:gap-6 xl:flex">
              <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
                <div className="w-full mx-auto">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow-0">
                      <button
                        type="button"
                        disabled={isCheck.length < 1}
                        onClick={() => handleUpdateMany(isCheck)}
                        className="w-full rounded-md h-12 btn-gray text-gray-600 bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium"
                      >
                        <span className="mr-2">
                          <FiEdit />
                        </span>
                        {t("BulkAction")}
                      </button>
                    </div>
                    <div className="flex-grow-0">
                      <button
                        type="button"
                        disabled={isCheck?.length < 1}
                        onClick={() => handleDeleteMany(isCheck, data?.banners || [])}
                        className="w-full rounded-md h-12 bg-red-300 disabled:opacity-50 disabled:cursor-not-allowed text-red-700 px-4 py-2 text-sm font-medium"
                      >
                        <span className="mr-2">
                          <FiTrash2 />
                        </span>
                        {t("Delete")}
                      </button>
                    </div>
                    <div className="flex-grow-0">
                      <button
                        type="button"
                        onClick={toggleDrawer}
                        className="w-full rounded-md h-12 bg-blue-500 text-white px-4 py-2 text-sm font-medium"
                      >
                        <span className="mr-2">
                          <FiPlus />
                        </span>
                        {t("AddBanner")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 rounded-t-lg rounded-0 mb-4">
          <div className="p-4">
            <form
              onSubmit={handleSubmitForAll}
              className="py-3 grid gap-4 lg:gap-6 xl:gap-6 md:flex xl:flex"
            >
              <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
                <input
                  ref={searchRef}
                  type="search"
                  name="search"
                  placeholder={t("SearchBannersByTitleOrLocation")}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">{t("AllLocations")}</option>
                  {Object.entries(BANNER_LOCATIONS).map(([key, location]) => (
                    <option key={key} value={key}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
                <select
                  value={sortedField}
                  onChange={(e) => setSortedField(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">{t("SortBy")}</option>
                  <option value="createdAt">{t("DateCreated")}</option>
                  <option value="title">{t("Title")}</option>
                  <option value="location">{t("Location")}</option>
                  <option value="status">{t("Status")}</option>
                </select>
              </div>

              <div className="flex-grow-0">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {t("Filter")}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Banner Table */}
        <SimpleTableContainer>
          <SimpleTable>
            <SimpleTableHeader>
              <tr>
                <SimpleTableHeaderCell>
                  <CheckBox
                    type="checkbox"
                    name="selectAll"
                    id="selectAll"
                    handleClick={handleSelectAll}
                    isChecked={isCheckAll}
                  />
                </SimpleTableHeaderCell>
                <SimpleTableHeaderCell>{t("Image")}</SimpleTableHeaderCell>
                <SimpleTableHeaderCell>{t("Title")}</SimpleTableHeaderCell>
                <SimpleTableHeaderCell>{t("Location")}</SimpleTableHeaderCell>
                <SimpleTableHeaderCell>{t("Dimensions")}</SimpleTableHeaderCell>
                <SimpleTableHeaderCell>{t("Status")}</SimpleTableHeaderCell>
                <SimpleTableHeaderCell>{t("Schedule")}</SimpleTableHeaderCell>
                <SimpleTableHeaderCell>{t("Actions")}</SimpleTableHeaderCell>
              </tr>
            </SimpleTableHeader>

            <SimpleTableBody>
              {loading ? (
                <TableLoading count={12} />
              ) : error ? (
                <tr>
                  <SimpleTableCell colSpan={8}>
                    <span className="text-red-500">
                      {error?.response?.data?.message || error.message}
                    </span>
                  </SimpleTableCell>
                </tr>
              ) : filteredBanners?.length > 0 ? (
                filteredBanners.map((banner) => {
                  const locationInfo = getBannerLocationInfo(banner.location);
                  return (
                    <SimpleTableRow key={banner._id}>
                      <SimpleTableCell>
                        <CheckBox
                          type="checkbox"
                          name={banner._id}
                          id={banner._id}
                          handleClick={(e) => {
                            const { checked, name } = e.target;
                            if (checked) {
                              setIsCheck([...isCheck, name]);
                            } else {
                              setIsCheck(isCheck.filter((item) => item !== name));
                            }
                          }}
                          isChecked={isCheck?.includes(banner._id)}
                        />
                      </SimpleTableCell>

                      <SimpleTableCell>
                        <div className="flex items-center">
                          {banner.imageUrl ? (
                            <img
                              src={banner.imageUrl}
                              alt={getLocalizedText(banner.title, 'Banner')}
                              className="w-12 h-8 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-12 h-8 bg-gray-200 rounded border flex items-center justify-center">
                              <FiImage className="text-gray-400 text-sm" />
                            </div>
                          )}
                        </div>
                      </SimpleTableCell>

                      <SimpleTableCell>
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {getLocalizedText(banner.title, '')}
                          </span>
                          {banner.description && (
                            <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                              {getLocalizedText(banner.description, '')}
                            </p>
                          )}
                        </div>
                      </SimpleTableCell>

                      <SimpleTableCell>
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {locationInfo.name}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {locationInfo.description}
                          </p>
                        </div>
                      </SimpleTableCell>

                      <SimpleTableCell>
                        <div className="flex items-center text-xs text-gray-500">
                          <FiMonitor className="mr-1" />
                          {locationInfo.dimensions.width}×{locationInfo.dimensions.height}
                        </div>
                      </SimpleTableCell>

                      <SimpleTableCell>
                        {getStatusBadge(banner.status)}
                      </SimpleTableCell>

                      <SimpleTableCell>
                        <div className="text-xs text-gray-500">
                          {banner.startDate && (
                            <div>{t("Start")}: {new Date(banner.startDate).toLocaleDateString()}</div>
                          )}
                          {banner.endDate && (
                            <div>{t("End")}: {new Date(banner.endDate).toLocaleDateString()}</div>
                          )}
                          {!banner.startDate && !banner.endDate && (
                            <span>{t("AlwaysActive")}</span>
                          )}
                        </div>
                      </SimpleTableCell>

                      <SimpleTableCell>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdate(banner._id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteMany([banner._id], [banner])}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </SimpleTableCell>
                    </SimpleTableRow>
                  );
                })
              ) : (
                <tr>
                  <SimpleTableCell colSpan={8}>
                    <NotFound title={t("NoBannersFound")} />
                  </SimpleTableCell>
                </tr>
              )}
            </SimpleTableBody>
          </SimpleTable>

          <SimpleTableFooter>
            <SimplePagination
              totalResults={data?.totalDoc}
              resultsPerPage={limitData}
              onChange={handleChangePage}
              label={t("TableNavigation")}
            />
          </SimpleTableFooter>
        </SimpleTableContainer>
      </AnimatedContent>
    </>
  );
};

export default Banners;