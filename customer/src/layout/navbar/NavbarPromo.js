import { Fragment, useState, useEffect, useContext } from "react";
import Link from "next/link";
import { Transition, Popover } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/outline";
import SettingServices from "@services/SettingServices";
import Cookies from "js-cookie";
import {
  FiGift,
  FiAlertCircle,
  FiHelpCircle,
  FiShoppingBag,
  FiFileText,
  FiUsers,
  FiPocket,
  FiPhoneIncoming,
  FiHome,
  FiGrid,
  FiTag,
  FiLayers,
} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

//internal import
import useGetSetting from "@hooks/useGetSetting";
import Category from "@components/category/Category";
import { SidebarContext } from "@context/SidebarContext";
import useUtilsFunction from "@hooks/useUtilsFunction";
import useTranslation from "next-translate/useTranslation";
import LanguageSelector from "@components/common/LanguageSelector";
import CategoryDropdown from "@components/category/CategoryDropdown";

const NavbarPromo = () => {
  const { t } = useTranslation();
  const { lang, storeCustomizationSetting } = useGetSetting();
  const { isLoading, setIsLoading } = useContext(SidebarContext);

  const { showingTranslateValue } = useUtilsFunction();

  const currentLanguageCookie = Cookies.get("_curr_lang");

  let currentLang = {};
  if (currentLanguageCookie && currentLanguageCookie !== "undefined") {
    try {
      currentLang = JSON.parse(currentLanguageCookie);
    } catch (error) {
      // console.error("Error parsing current language cookie:", error);
      currentLang = {}; // Fallback to an empty object or handle as necessary
    }
  } else {
    currentLang = null;
  }
  // const translation = t("common:search-placeholder");
  // console.log("Translated title:", translation, router, router.pathname);

  const handleLanguage = (lang) => {
    Cookies.set("_lang", lang?.iso_code, {
      sameSite: "None",
      secure: true,
    });
    Cookies.set("_curr_lang", JSON.stringify(lang), {
      sameSite: "None",
      secure: true,
    });
  };
  const { data: languages, isFetched } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => await SettingServices.getShowingLanguage(),
    staleTime: 10 * 60 * 1000, //cache for 10 minutes,
    gcTime: 15 * 60 * 1000,
  });

  // Filter languages to only show English and Arabic
  const filteredLanguages = languages?.filter(
    lang => lang.iso_code === 'en' || lang.iso_code === 'ar'
  ) || [];

  const currentLanguage = Cookies.get("_curr_lang");
  if (!currentLanguage && isFetched) {
    const result = filteredLanguages?.find((language) => language?.iso_code === lang);
    Cookies.set("_curr_lang", JSON.stringify(result || filteredLanguages[0]), {
      sameSite: "None",
      secure: true,
    });
    // console.log("result", result);
  }

  return (
    <>
      <div className="hidden lg:block xl:block border-t border-gray-100" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            
            {/* Left Navigation */}
            <div className="flex items-center space-x-8">
              <Popover className="relative">
                <div className="max-w-7xl mx-auto">
                  <div className="flex justify-between items-center md:justify-start md:space-x-10">
                    <Popover.Group as="nav" className="flex items-center space-x-8">
                      
                      {/* Home */}
                      <Link
                        href="/"
                        onClick={() => setIsLoading(!isLoading)}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md group"
                        style={{
                          background: "transparent",
                          "&:hover": { backgroundColor: "#76bd44" }
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#76bd44"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        <FiHome className="w-4 h-4" />
                        <span>{t("common:HOME")}</span>
                      </Link>

                      {/* All Products */}
                      <Link
                        href="/products"
                        onClick={() => setIsLoading(!isLoading)}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#76bd44"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        <FiGrid className="w-4 h-4" />
                        <span>{t("common:Products")}</span>
                      </Link>

                      {/* Promotions */}
                      <Link
                        href="/promotions"
                        onClick={() => setIsLoading(!isLoading)}
                        className="relative flex items-center space-x-2 px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md"
                        style={{ backgroundColor: "#74338c" }}
                      >
                        <FiGift className="w-4 h-4" />
                        <span>{t("common:Promotions")}</span>
                        <div className="absolute -top-1 -right-1 flex">
                          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-pink-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                        </div>
                      </Link>

                      {/* Categories – link + dropdown */}
                      {storeCustomizationSetting?.navbar?.categories_menu_status && (
                        <div className="flex items-center relative">
                          {/* direct link to categories page */}
                          <Link
                            href="/categories" // adjust route if different
                            onClick={() => setIsLoading(!isLoading)}
                            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#76bd44")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <FiLayers className="w-4 h-4" />
                            <span>{t("common:Categories")}</span>
                          </Link>

                          {/* dropdown arrow for category list */}
                          <Popover className="relative">
                            <Popover.Button className="p-2 text-gray-700 hover:text-white rounded-lg transition-all duration-200 focus:outline-none hover:shadow-md"
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#76bd44")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <ChevronDownIcon className="h-4 w-4" />
                            </Popover.Button>

                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-200"
                              enterFrom="opacity-0 translate-y-1"
                              enterTo="opacity-100 translate-y-0"
                              leave="transition ease-in duration-150"
                              leaveFrom="opacity-100 translate-y-0"
                              leaveTo="opacity-0 translate-y-1"
                            >
                              <Popover.Panel className="absolute z-10 mt-3 transform w-screen max-w-sm">
                                <div className="rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden bg-white">
                                  <div className="max-h-96 overflow-y-auto scrollbar-hide">
                                    <CategoryDropdown />
                                  </div>
                                </div>
                              </Popover.Panel>
                            </Transition>
                          </Popover>
                        </div>
                      )}

                      {/* About Us Link */}
                      {storeCustomizationSetting?.navbar?.about_menu_status && (
                        <Link
                          href="/about-us"
                          onClick={() => setIsLoading(!isLoading)}
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#76bd44")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <FiUsers className="w-4 h-4" />
                          <span>{t("common:About Us")}</span>
                        </Link>
                      )}



                      {/* Pages Link */}
                      {storeCustomizationSetting?.navbar?.pages_menu_status && (
                        <Link
                          href="/pages"
                          onClick={() => setIsLoading(!isLoading)}
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#76bd44")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <FiFileText className="w-4 h-4" />
                          <span>{t("common:Pages")}</span>
                        </Link>
                      )}
                    </Popover.Group>
                  </div>
                </div>
              </Popover>
            </div>

            {/* Right Navigation - Call Us, Delivery, Language */}
            <div className="flex items-center space-x-8 text-gray-700 text-sm font-medium">
              {storeCustomizationSetting?.navbar?.call_us_status && (
                <a
                  href={`tel:${storeCustomizationSetting?.navbar?.call_us_phone || ''}`}
                  className="flex items-center space-x-2 hover:text-emerald-600 transition-colors"
                >
                  <FiPhoneIncoming className="w-4 h-4" />
                  <span>{t("common:Call Us")}: {storeCustomizationSetting?.navbar?.call_us_phone}</span>
                </a>
              )}
              <span className="flex items-center space-x-2">
                <FiPocket className="w-4 h-4" />
                <span>{t("common:Fast delivery within city")}</span>
              </span>
              {/* Language Selector in top bar */}
              {/* <LanguageSelector /> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavbarPromo;
