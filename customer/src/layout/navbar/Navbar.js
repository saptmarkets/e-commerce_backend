import { useContext, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useCart } from "react-use-cart";
import { IoSearchOutline } from "react-icons/io5";
import { FiShoppingCart, FiUser, FiBell, FiChevronDown, FiTrash2 } from "react-icons/fi";
import useTranslation from "next-translate/useTranslation";

//internal import
import { getUserSession } from "@lib/auth";
import useGetSetting from "@hooks/useGetSetting";
import { handleLogEvent } from "src/lib/analytics";
import NavbarPromo from "@layout/navbar/NavbarPromo";
import CartDrawer from "@components/drawer/CartDrawer";
import { SidebarContext } from "@context/SidebarContext";
import LanguageSelector from "@components/common/LanguageSelector";
import { UserContext } from "@context/UserContext";
import SocialLinks from "@components/common/SocialLinks";

import useUtilsFunction from "@hooks/useUtilsFunction";
import NotificationServices from "@services/NotificationServices";

const Navbar = () => {
  const { t, lang } = useTranslation("common");
  const [searchText, setSearchText] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { toggleCartDrawer } = useContext(SidebarContext);
  const { totalItems } = useCart();
  const router = useRouter();

  const userInfo = getUserSession();

  const { storeCustomizationSetting } = useGetSetting();

  const { showDateTimeFormat } = useUtilsFunction();

  const [imageUrl, setImageUrl] = useState("");
  const [searchValue, setSearchValue] = useState(searchText);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef();

  // Sync search text with URL query when on search page
  useEffect(() => {
    if (router.pathname === '/search' && router.query.query) {
      setSearchText(decodeURIComponent(router.query.query));
    } else if (router.pathname !== '/search') {
      // Clear search text when not on search page
      setSearchText("");
    }
  }, [router.pathname, router.query.query]);

  // Debounced search for live suggestions
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchText.length >= 2) {
        fetchSearchSuggestions(searchText);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchText]);

  const fetchSearchSuggestions = async (query) => {
    try {
      setIsSearching(true);
      const response = await fetch(`/api/search-suggestions?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (searchValue) {
      router.push(`/search?query=${encodeURIComponent(searchValue)}`, null, { scroll: false });
      // Don't clear search text - keep it visible
      handleLogEvent("search", `searched ${searchValue}`);
    } else {
      router.push(`/`, null, { scroll: false });
    }
  };

  const handleNotificationToggle = async () => {
    setNotificationOpen(!notificationOpen);
    if (!notificationOpen) {
      await fetchNotifications();
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await NotificationServices.getAllNotifications();
      setNotifications(response.notifications || []);
      setUnreadCount(response.totalUnreadDoc || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const handleNotificationRead = async (id) => {
    try {
      await NotificationServices.updateNotificationStatus(id, { status: "read" });
      await fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleNotificationDelete = async (id) => {
    try {
      await NotificationServices.deleteNotification(id);
      await fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  useEffect(() => {
    if (userInfo) {
      fetchNotifications();
    }
  }, [userInfo]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchText) {
      setSearchValue(searchText);
    }
  }, [searchText]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    setSearchText(value);
  };

  return (
    <>
      <CartDrawer />

      
      {/* Main Navigation */}
      <div className="bg-white sticky top-0 z-20 shadow-lg border-b border-gray-100">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo Section */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative w-14 h-10 md:w-16 md:h-12 transition-transform group-hover:scale-105">
                <Image
                  width="0"
                  height="0"
                  sizes="120vw"
                  className="w-full h-auto"
                  priority
                  src="/logo/logo-color.svg"
                  alt={t("common:SAPT Supermarket")}
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span style={{ color: "#74338c" }} className="font-semibold text-2xl md:text-3xl tracking-tight leading-none ml-1">
                    {t("common:MarketsTextPurple")}
                  </span>
                  <span style={{ color: "#76bd44" }} className="font-semibold text-2xl md:text-3xl tracking-tight leading-none ml-1">
                    {t("common:SAPTMarketsTextGreen")}
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-medium tracking-wide">{t("common:fantasticOffers")}</span>
              </div>
            </Link>

            {/* Search Section */}
            <div className="flex-1 max-w-2xl mx-8 lg:mx-12">
              <div className="relative">
                <form onSubmit={handleSubmit} className="relative">
                  <div className="relative flex items-center">
                    <input
                      onChange={handleSearchChange}
                      onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      value={searchValue}
                      className="w-full h-12 pl-6 pr-14 text-gray-700 placeholder-gray-400 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-white transition-all duration-300 text-sm font-medium"
                      placeholder={t("common:search-placeholder")}
                    />
                    <button
                      type="submit"
                      className="absolute right-2 w-10 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: "#76bd44" }}
                    >
                      <IoSearchOutline className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </form>

                {/* Enhanced Search Suggestions */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 mt-2 max-h-64 overflow-y-auto">
                    <div className="p-2">
                      {searchSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSearchValue(suggestion);
                            setShowSuggestions(false);
                            router.push(`/search?query=${encodeURIComponent(suggestion)}`);
                          }}
                          className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                        >
                          <IoSearchOutline className="w-4 h-4 text-gray-400 mr-3" />
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              
              {/* Social links & Language Selector & Notifications */}
              <div className="flex items-center space-x-3">
                <SocialLinks className="hidden lg:flex" />
                <LanguageSelector />
                
                {/* Notification Bell */}
                {userInfo && (
                  <div className="relative" ref={notificationRef}>
                    <button 
                      onClick={handleNotificationToggle}
                      className="relative p-3 text-gray-600 hover:text-purple-600 transition-colors rounded-xl hover:bg-gray-50"
                    >
                      <FiBell className="w-6 h-6" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {notificationOpen && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="p-4 border-b border-gray-100">
                          <h3 className="font-semibold text-gray-800">{t("common:Notifications")}</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              {t("common:noNotifications")}
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification._id}
                                className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                                  notification.status === 'unread' ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <Link
                                      href={
                                        notification.orderId
                                          ? `/order/${notification.orderId}`
                                          : '#'
                                      }
                                      onClick={() => handleNotificationRead(notification._id)}
                                      className="block"
                                    >
                                      <p className="text-sm text-gray-800 mb-1">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {showDateTimeFormat(notification.createdAt)}
                                      </p>
                                    </Link>
                                  </div>
                                  <button
                                    onClick={() => handleNotificationDelete(notification._id)}
                                    className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
              <button
                onClick={toggleCartDrawer}
                className="relative p-3 text-gray-600 hover:text-purple-600 transition-all duration-200 rounded-xl hover:bg-gray-50 group"
              >
                <FiShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                {totalItems > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 w-6 h-6 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg"
                    style={{ backgroundColor: "#74338c" }}
                  >
                    {totalItems}
                  </span>
                )}
              </button>

              {/* User Account */}
              <div className="flex items-center">
                {userInfo?.image ? (
                  <Link href="/user/dashboard" className="relative">
                    <Image
                      width={40}
                      height={40}
                      src={userInfo?.image}
                      alt="user"
                      className="w-10 h-10 rounded-full border-2 border-purple-200 hover:border-purple-400 transition-colors"
                    />
                  </Link>
                ) : userInfo?.name ? (
                  <Link href="/user/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all hover:scale-105" style={{ backgroundColor: "#74338c" }}>
                    {userInfo?.name[0].toUpperCase()}
                  </Link>
                ) : (
                  <Link href="/auth/login" className="flex items-center space-x-2 px-4 py-2 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-md" style={{ backgroundColor: "#74338c" }}>
                    <FiUser className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("common:Login")}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced second header */}
        <NavbarPromo />
      </div>
    </>
  );
};
export default dynamic(() => Promise.resolve(Navbar), { ssr: false });
