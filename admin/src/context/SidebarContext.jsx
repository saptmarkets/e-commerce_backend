import LanguageServices from "@/services/LanguageServices";
import SettingServices from "@/services/SettingServices";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { createContext, useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

// create context
export const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const resultsPerPage = 20;
  const searchRef = useRef("");
  const invoiceRef = useRef("");
  // const dispatch = useDispatch();

  const [limitData, setLimitData] = useState(20);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCouponDeleteModalOpen, setIsCouponDeleteModalOpen] = useState(false);
  const [isPromotionDeleteModalOpen, setIsPromotionDeleteModalOpen] = useState(false);
  const [isProductDeleteModalOpen, setIsProductDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [lang, setLang] = useState("en");
  const [currLang, setCurrLang] = useState({
    iso_code: "en",
    name: "English",
    flag: "US",
  });
  const [time, setTime] = useState("");
  const [sortedField, setSortedField] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [method, setMethod] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [windowDimension, setWindowDimension] = useState(window.innerWidth);
  const [loading, setLoading] = useState(false);
  const [navBar, setNavBar] = useState(true);
  const { i18n } = useTranslation();
  const [tabIndex, setTabIndex] = useState(0);
  const { data: globalSetting } = useQuery({
    queryKey: ["globalSetting"],
    queryFn: async () => await SettingServices.getGlobalSetting(),
    staleTime: 20 * 60 * 1000, //cache for 20 minutes,
    gcTime: 25 * 60 * 1000,
  });

  const { data: languages } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => await LanguageServices.getShowingLanguage(),
    staleTime: 20 * 60 * 1000, //cache for 20 minutes,
    gcTime: 25 * 60 * 1000,
  });

  // Track whether we're currently editing product units
  const [isEditingProductUnits, setIsEditingProductUnits] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => {
    console.log('Toggle Sidebar called, new state will be:', !isSidebarOpen);
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeDrawer = () => {
    // If we're currently editing product units, prevent auto-closing
    if (isEditingProductUnits) {
      console.log('Drawer close prevented: currently editing product units');
      return;
    }
    setIsDrawerOpen(false);
  };
  
  const toggleDrawer = () => {
    console.log('Toggle Drawer called, new state will be:', !isDrawerOpen);
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeBulkDrawer = () => setIsBulkDrawerOpen(false);
  const toggleBulkDrawer = () => setIsBulkDrawerOpen(!isBulkDrawerOpen);

  const closeModal = () => setIsModalOpen(false);
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleLanguageChange = (value) => {
    // console.log("handleChangeLang", value);

    Cookies.set("i18next", value?.iso_code, {
      sameSite: "None",
      secure: true, // Include the "secure" attribute
    });
    i18n.changeLanguage(value?.iso_code);
    setLang(value?.iso_code);
    Cookies.set("_currLang", JSON.stringify(value), {
      sameSite: "None",
      secure: true, // Include the "secure" attribute
    });
    setCurrLang(value);
    
    // Set HTML lang attribute for proper RTL support
    document.documentElement.lang = value?.iso_code;
    
    // Set RTL direction for Arabic
    if (value?.iso_code === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  const handleChangePage = (p) => {
    setCurrentPage(p);
  };

  const handleSubmitForAll = (e) => {
    e.preventDefault();
    if (!searchRef?.current?.value) return setSearchText(null);
    setSearchText(searchRef?.current?.value);
    setCategory(null);
  };

  // console.log("globalSetting", globalSetting, "languages", languages);

  useEffect(() => {
    const pathname = window?.location.pathname === "/login";

    // if (pathname) return;
    const defaultLang = globalSetting?.default_language || "en";
    const cookieLang = Cookies.get("i18next");
    const currLang = Cookies.get("_currLang");

    const removeRegion = (langCode) => langCode?.split("-")[0];

    let selectedLang = removeRegion(cookieLang || defaultLang);

    // Ensure language consistency with global settings
    if (globalSetting?.default_language) {
      selectedLang = removeRegion(globalSetting.default_language);
    }

    // Update state with selected language
    setLang(selectedLang);

    // Set i18next language & update cookies **only when needed**
    if (!cookieLang || cookieLang !== selectedLang) {
      Cookies.set("i18next", selectedLang, {
        sameSite: "None",
        secure: true,
      });
    }

    // Change i18n language **only if it differs**
    if (i18n.language !== selectedLang && !currLang) {
      i18n.changeLanguage(selectedLang);
    }

    // Find the corresponding language object
    if (languages?.length && !pathname && !currLang) {
      const result = languages?.find((lang) => lang?.iso_code === selectedLang);
      setCurrLang(result);
    }
    
    // Set HTML lang attribute for proper RTL support
    document.documentElement.lang = selectedLang;
    
    // Set RTL direction for Arabic
    if (selectedLang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [globalSetting?.default_language, languages]); // Add `languages` as a dependency

  useEffect(() => {
    function handleResize() {
      setWindowDimension(window.innerWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const value = useMemo(
    () => ({
      method,
      setMethod,
      isSidebarOpen,
      toggleSidebar,
      closeSidebar,
      isDrawerOpen,
      toggleDrawer,
      closeDrawer,
      setIsDrawerOpen,
      closeBulkDrawer,
      isBulkDrawerOpen,
      toggleBulkDrawer,
      isModalOpen,
      toggleModal,
      closeModal,
      isCouponDeleteModalOpen,
      setIsCouponDeleteModalOpen,
      isPromotionDeleteModalOpen,
      setIsPromotionDeleteModalOpen,
      isProductDeleteModalOpen,
      setIsProductDeleteModalOpen,
      isSubmitting,
      setIsSubmitting,
      isLoading,
      setIsLoading,
      isUpdate,
      setIsUpdate,
      lang,
      setLang,
      currLang,
      handleLanguageChange,
      currentPage,
      setCurrentPage,
      handleChangePage,
      searchText,
      setSearchText,
      category,
      setCategory,
      searchRef,
      handleSubmitForAll,
      status,
      setStatus,
      zone,
      setZone,
      time,
      setTime,
      sortedField,
      setSortedField,
      resultsPerPage,
      limitData,
      setLimitData,
      windowDimension,
      modalOpen,
      setModalOpen,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
      loading,
      setLoading,
      invoice,
      setInvoice,
      invoiceRef,
      setNavBar,
      navBar,
      tabIndex,
      setTabIndex,
      isEditingProductUnits,
      setIsEditingProductUnits,
    }),
    [
      isDrawerOpen,
      isSidebarOpen,
      isBulkDrawerOpen,
      isModalOpen,
      isCouponDeleteModalOpen,
      isPromotionDeleteModalOpen,
      isProductDeleteModalOpen,
      isSubmitting,
      isLoading,
      isUpdate,
      lang,
      currLang,
      currentPage,
      searchText,
      category,
      status,
      zone,
      time,
      sortedField,
      method,
      windowDimension,
      limitData,
      modalOpen,
      startDate,
      endDate,
      loading,
      navBar,
      invoice,
      tabIndex,
      isEditingProductUnits,
    ]
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};
