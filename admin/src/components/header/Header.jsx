import { Avatar, Badge, WindmillContext } from "@windmill/react-ui";
import Cookies from "js-cookie";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";

import {
  FiTrash2,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiSun,
  FiMoon,
  FiBell,
  FiSettings,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import cookies from "js-cookie";
import { useTranslation } from "react-i18next";

//internal import
import ellipse from "@/assets/img/icons/ellipse.svg";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import useNotification from "@/hooks/useNotification";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import NotFoundTwo from "@/components/table/NotFoundTwo";
import NotificationServices from "@/services/NotificationServices";
import SelectLanguage from "@/components/form/selectOption/SelectLanguage";
import sidebar from '@/routes/sidebar';
import logoDark from "@/assets/img/logo/logo-color.svg";
import logoLight from "@/assets/img/logo/logo-dark.svg";
import { notifyError } from "@/utils/toast";

const Header = () => {
  const { toggleSidebar, handleLanguageChange, setNavBar, navBar, currLang } =
    useContext(SidebarContext);
  const { state, dispatch } = useContext(AdminContext);
  const { adminInfo } = state;
  const { mode, toggleMode } = useContext(WindmillContext);
  const pRef = useRef();
  const nRef = useRef();

  const currentLanguageCode = cookies.get("i18next") || "en";
  const { t } = useTranslation();
  const { updated, setUpdated } = useNotification();
  const { showDateTimeFormat } = useUtilsFunction();

  const [data, setData] = useState([]);
  const [totalDoc, setTotalDoc] = useState(0);
  const [totalUnreadDoc, setTotalUnreadDoc] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  // Responsive nav state
  const [navOpen, setNavOpen] = useState(false);

  // console.log("currentLanguageCode", currentLanguageCode);

  const handleLogOut = () => {
    dispatch({ type: "USER_LOGOUT" });
    Cookies.remove("adminInfo");
    window.location.replace(`${import.meta.env.VITE_APP_ADMIN_DOMAIN}/login`);
  };

  const handleNotificationOpen = async () => {
    setNotificationOpen(!notificationOpen);
    setProfileOpen(false);
    await handleGetAllNotifications();
  };
  const handleProfileOpen = () => {
    setProfileOpen(!profileOpen);
    setNotificationOpen(false);
  };

  // handle notification status change
  const handleNotificationStatusChange = async (id) => {
    try {
      await NotificationServices.updateStatusNotification(id, {
        status: "read",
      });

      const getAllRes = await NotificationServices.getAllNotification();
      setData(getAllRes?.notifications);
      setTotalUnreadDoc(getAllRes?.totalUnreadDoc);
      window.location.reload(false);
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  // handle notification delete
  const handleNotificationDelete = async (id) => {
    try {
      await NotificationServices.deleteNotification(id);
      const getAllRes = await NotificationServices.getAllNotification();
      setData(getAllRes?.notifications);
      setTotalUnreadDoc(getAllRes?.totalUnreadDoc);
      setTotalDoc(getAllRes?.totalDoc);
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  //handle get notifications
  const handleGetAllNotifications = async () => {
    try {
      const res = await NotificationServices.getAllNotification();
      // console.log("notifcation api called", res);
      setData(res?.notifications);
      setTotalUnreadDoc(res?.totalUnreadDoc);
      setTotalDoc(res?.totalDoc);
      setUpdated(false);
    } catch (err) {
      setUpdated(false);
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!pRef?.current?.contains(e.target)) {
        setProfileOpen(false);
      }
      if (!nRef?.current?.contains(e.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
  }, [pRef, nRef]);

  // notification api calling
  useEffect(() => {
    handleGetAllNotifications();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updated]);

  // console.log("notificaiotn", data);
  return (
    <>
      <header className="z-30 py-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md shadow-xl rounded-b-2xl border-b-4 border-emerald-300">
        <div className="container flex items-center justify-between h-full px-3 mx-auto">
          {/* Logo on the left */}
          <a href="/dashboard" className="flex items-center mr-6">
            {mode === "dark" ? (
              <img src={logoLight} alt="saptmarkets" width="135" />
            ) : (
              <img src={logoDark} alt="saptmarkets" width="135" />
            )}
          </a>
          
          {/* Hamburger for mobile */}
          <button
            className="p-1 mr-5 -ml-1 rounded-md lg:hidden focus:outline-none text-gray-900 dark:text-gray-100" 
            onClick={() => setNavOpen(!navOpen)} 
            aria-label="Menu"
          >
            <FiMenu className="w-6 h-6" aria-hidden="true" />
          </button>
          
          {/* Main navigation links */}
          <nav className={`flex-1 flex items-center justify-center overflow-x-auto lg:overflow-x-visible`}> {/*
  Trisha & Hue: Now scrolls on mobile, wraps on desktop! */}
  <ul className="flex flex-row flex-wrap gap-3 md:gap-4 items-center whitespace-nowrap lg:whitespace-normal">
              {/* Trisha: Render all main nav links and dropdowns with black bold text */}
              {sidebar.map((route) =>
                route.routes ? (
                  <li className="relative group" key={route.name}>
                    <button className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-200 hover:text-yellow-500 dark:hover:text-yellow-300 focus:outline-none transition-colors duration-200 text-xs md:text-sm lg:text-base px-1.5 py-0.5 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 shadow-md max-w-[96px] md:max-w-[112px] lg:max-w-none truncate">
                      <route.icon className="w-5 h-5" />
                      <span className="truncate">{t(`${route.name}`)}</span>
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <ul className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-200 dark:border-gray-700">
                      {route.routes.map((sub) => (
                        <li key={sub.name}>
                          <Link 
                            to={sub.path} 
                            target={sub.outside ? '_blank' : '_self'} 
                            className="block px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                          >
                            {t(`${sub.name}`)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li key={route.name}>
                    <Link 
                      to={route.path} 
                      className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-200 hover:text-yellow-500 dark:hover:text-yellow-300 transition-colors duration-200 text-xs md:text-sm lg:text-base px-1.5 py-0.5 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 shadow-md max-w-[96px] md:max-w-[112px] lg:max-w-none truncate"
                    >
                      <route.icon className="w-5 h-5" />
                      <span className="truncate">{t(`${route.name}`)}</span>
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>
          
          {/* Right side: language, notifications, profile, theme toggler */}
          <ul className="flex justify-end items-center flex-shrink-0 space-x-4">
            <li className="changeLanguage">
              <div className="dropdown">
                  <button className="dropbtn focus:outline-none flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200">
                  <div
                    className={`text-sm flag ${currLang?.flag?.toLowerCase()}`}
                    ></div>
                    <span className="md:inline-block hidden font-medium">
                    {currLang?.name}
                  </span>
                    <span className="md:hidden uppercase font-medium">
                    {currLang?.iso_code}
                  </span>
                </button>

                <SelectLanguage handleLanguageChange={handleLanguageChange} />
              </div>
            </li>

              {/* Theme toggler */}
            <li className="flex">
              <button
                  className="rounded-md focus:outline-none text-gray-900 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200"
                onClick={toggleMode}
                aria-label="Toggle color mode"
              >
                {mode === "dark" ? (
                  <FiSun className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <FiMoon className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            </li>

              {/* Notifications menu */}
            <li className="relative inline-block text-left" ref={nRef}>
              <button
                  className="relative align-middle rounded-md focus:outline-none text-gray-900 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200"
                onClick={handleNotificationOpen}
              >
                <FiBell
                    className="w-5 h-5"
                  aria-hidden="true"
                />

                <span className="absolute z-10 top-0 right-0 inline-flex items-center justify-center p-1 h-5 w-5 text-xs font-medium leading-none text-red-100 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                  {totalUnreadDoc}
                </span>
              </button>

              {notificationOpen && (
                <div className="origin-top-right absolute md:right-0 -right-3 top-2 rounded-md shadow-lg bg-white dark:bg-gray-800  focus:outline-none">
                  <div
                    className={`${
                      data?.length === 0
                        ? "h-40"
                        : data?.length <= 2
                        ? "h-40"
                        : data?.length <= 3
                        ? "h-56"
                        : "h-330"
                    } md:w-400 w-300`}
                  >
                    <Scrollbars>
                      {data?.length === 0 ? (
                        <NotFoundTwo title="No new notification" />
                      ) : (
                        <ul className="block text-sm border-t border-gray-100 dark:border-gray-700 rounded-md">
                          {data?.map((value, index) => {
                            return (
                              <li
                                key={index + 1}
                                className={`flex justify-between items-center font-serif font-normal text-sm py-3 border-b border-gray-100 dark:border-gray-700 px-3 transition-colors duration-150 hover:bg-gray-100 ${
                                  value.status === "unread" && "bg-gray-50"
                                } hover:text-gray-800 dark:text-gray-400 ${
                                  value.status === "unread" &&
                                  "dark:bg-gray-800"
                                } dark:hover:bg-gray-900  dark:hover:text-gray-100 cursor-pointer`}
                              >
                                <Link
                                  to={
                                    value.productId
                                      ? `/product/${value.productId}`
                                      : value.orderId
                                      ? `/order/${value.orderId}`
                                      : "/our-staff"
                                  }
                                  className="flex items-center"
                                  onClick={() =>
                                    handleNotificationStatusChange(value._id)
                                  }
                                >
                                  <Avatar
                                    className="mr-2 md:block bg-gray-50 border border-gray-200"
                                    src={value.image}
                                    alt="image"
                                  />

                                  <div className="notification-content">
                                    <h6 className="font-medium text-gray-500">
                                      {value?.message}
                                    </h6>

                                    <p className="flex items-center text-xs text-gray-400">
                                      {value.productId ? (
                                        <Badge type="danger">Stock Out</Badge>
                                      ) : (
                                        <Badge type="success">New Order</Badge>
                                      )}
                                      <span className="ml-2">
                                        {showDateTimeFormat(value.createdAt)}
                                      </span>
                                    </p>
                                  </div>

                                  {value.status === "unread" && (
                                    <span className="px-2 focus:outline-none">
                                      <img
                                        src={ellipse}
                                        width={12}
                                        height={12}
                                        alt="ellipse"
                                        className="w-3 h-3 text-emerald-600"
                                      />
                                    </span>
                                  )}
                                </Link>

                                <div className="group inline-block relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleNotificationDelete(value._id)
                                    }
                                    className="px-2 group-hover:text-blue-500 text-red-500 focus:outline-none"
                                  >
                                    <FiTrash2 />
                                  </button>

                                  <div className="absolute hidden group-hover:inline-block bg-gray-50 dark:text-red-400 mr-6 mb-1 right-0 z-50 px-3 py-2 text-sm font-medium text-red-600 rounded-lg shadow-sm tooltip dark:bg-gray-700">
                                    Delete
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {totalDoc > 5 && (
                        <div className="text-center py-2">
                          <Link
                            onClick={() => setNotificationOpen(false)}
                            to={"/notifications"}
                            className="focus:outline-none hover:underline transition ease-out duration-200"
                          >
                            Show all notifications
                          </Link>
                        </div>
                      )}
                    </Scrollbars>
                  </div>
                </div>
              )}
            </li>

              {/* Profile menu */}
            <li className="relative inline-block text-left" ref={pRef}>
              <button
                  className="rounded-full dark:bg-gray-500 bg-emerald-500 text-white h-8 w-8 font-medium mx-auto focus:outline-none hover:bg-emerald-600 dark:hover:bg-gray-400 transition-colors duration-200"
                onClick={handleProfileOpen}
              >
                {adminInfo.image ? (
                  <Avatar
                    className="align-middle"
                    src={`${adminInfo.image}`}
                    aria-hidden="true"
                  />
                ) : (
                  <span>{adminInfo.email[0].toUpperCase()}</span>
                )}
              </button>

              {profileOpen && (
                  <ul className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 focus:outline-none border border-gray-200 dark:border-gray-700">
                  <li className="justify-between font-serif font-medium py-2 pl-4 transition-colors duration-150 hover:bg-gray-100 text-gray-500 hover:text-emerald-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                    <Link to="/dashboard">
                      <span className="flex items-center text-sm">
                        <FiGrid className="w-4 h-4 mr-3" aria-hidden="true" />
                        <span>{t("Dashboard")}</span>
                      </span>
                    </Link>
                  </li>

                  <li className="justify-between font-serif font-medium py-2 pl-4 transition-colors duration-150 hover:bg-gray-100 text-gray-500 hover:text-emerald-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                    <Link to="/edit-profile">
                      <span className="flex items-center text-sm">
                        <FiSettings
                          className="w-4 h-4 mr-3"
                          aria-hidden="true"
                        />
                        <span>{t("EditProfile")}</span>
                      </span>
                    </Link>
                  </li>

                  <li
                    onClick={handleLogOut}
                    className="cursor-pointer justify-between font-serif font-medium py-2 pl-4 transition-colors duration-150 hover:bg-gray-100 text-gray-500 hover:text-emerald-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  >
                    <span className="flex items-center text-sm">
                      <FiLogOut className="w-4 h-4 mr-3" aria-hidden="true" />
                      <span>{t("LogOut")}</span>
                    </span>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </div>
      </header>
    </>
  );
};

export default Header;
