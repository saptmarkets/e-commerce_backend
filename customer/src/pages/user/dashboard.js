import Cookies from "js-cookie";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import { IoLockOpenOutline } from "react-icons/io5";
import {
  FiCheck,
  FiFileText,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiSettings,
  FiShoppingCart,
  FiTruck,
  FiUser,
  FiStar,
  FiClock,
} from "react-icons/fi";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import useTranslation from "next-translate/useTranslation";

//internal import
import Layout from "@layout/Layout";
import Card from "@components/order-card/Card";
import OrderServices from "@services/OrderServices";
import RecentOrder from "./recent-order";
import { SidebarContext } from "@context/SidebarContext";
import Loading from "@components/preloader/Loading";
import useGetSetting from "@hooks/useGetSetting";
import useUtilsFunction from "@hooks/useUtilsFunction";
import useLoginSubmit from "@hooks/useLoginSubmit";
import { UserContext } from "@context/UserContext";
import { handleUserLogout, getUserSession, isTokenExpired } from "@lib/auth";

const Dashboard = ({ title, description, children }) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { isLoading, setIsLoading, currentPage } = useContext(SidebarContext);
  const { dispatch } = useContext(UserContext);
  const { handleLogout } = useLoginSubmit();
  const [userSessionValid, setUserSessionValid] = useState(true);

  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();

  // Check if user is authenticated
  useEffect(() => {
    const userInfo = getUserSession();
    
    if (!userInfo || !userInfo.token) {
      setUserSessionValid(false);
      // If no user info, redirect to login
      router.push('/auth/login');
      return;
    }
    
    // Check if token is expired
    if (isTokenExpired(userInfo.token)) {
      handleUserLogout(dispatch, signOut, true);
      return;
    }
    
    setUserSessionValid(true);
  }, []);

  const {
    data,
    error,
    isLoading: loading,
  } = useQuery({
    queryKey: ["orders", { currentPage }],
    queryFn: async () => {
      // Fetching order data...
      try {
        const result = await OrderServices.getOrderCustomer({
          page: currentPage,
          limit: 10,
        });
        // Data fetched successfully
        return result;
      } catch (error) {
        console.error("❌ Customer Dashboard: Error fetching data", error);
        throw error;
      }
    },
    enabled: userSessionValid, // Only run query if user session is valid
    retry: 3,
    retryDelay: 1000,
  });

  // Customer Dashboard State logged

  const handleLogOut = () => {
    handleLogout();
  };

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const userSidebar = [
    {
      title: t('dashboard'),
      href: "/user/dashboard",
      icon: FiGrid,
    },

    {
      title: t('myOrders'),
      href: "/user/my-orders",
      icon: FiList,
    },
    {
      title: t('myAccount'),
      href: "/user/my-account",
      icon: FiUser,
    },
    {
      title: t('loyaltyProgram'),
      href: "/user/loyalty",
      icon: FiStar,
    },
    {
      title: t('purchaseHistory'),
      href: "/user/purchase-history",
      icon: FiClock,
    },

    {
      title: t('updateProfile'),
      href: "/user/update-profile",
      icon: FiSettings,
    },
    {
      title: t('changePassword'),
      href: "/user/change-password",
      icon: FiFileText,
    },
  ];

  if (!userSessionValid) {
    return <Loading loading={true} />;
  }

  return (
    <>
      {isLoading ? (
        <Loading loading={isLoading} />
      ) : (
        <Layout
          title={title ? title : t('dashboard')}
          description={description ? description : t('dashboard')}
        >
          <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
            <div className="py-10 lg:py-12 flex flex-col lg:flex-row w-full">
              <div className="flex-shrink-0 w-full lg:w-80 mr-7 lg:mr-10  xl:mr-10 ">
                <div className="bg-white p-4 sm:p-5 lg:p-8 rounded-md sticky top-32">
                  {userSidebar?.map((item) => (
                    <span
                      key={item.title}
                      className="p-2 my-2 flex font-serif items-center rounded-md hover:bg-gray-50 w-full hover:text-emerald-600"
                    >
                      <item.icon
                        className="flex-shrink-0 h-4 w-4"
                        aria-hidden="true"
                      />
                      <Link
                        href={item.href}
                        className="inline-flex items-center justify-between ml-2 text-sm font-medium w-full hover:text-emerald-600"
                      >
                        {item.title}
                      </Link>
                    </span>
                  ))}
                  <span className="p-2 flex font-serif items-center rounded-md hover:bg-gray-50 w-full hover:text-emerald-600">
                    <span className="mr-2">
                      <IoLockOpenOutline />
                    </span>{" "}
                    <button
                      onClick={handleLogOut}
                      className="inline-flex items-center justify-between text-sm font-medium w-full hover:text-emerald-600"
                    >
                      {t('logout')}
                    </button>
                  </span>
                </div>
              </div>
              <div className="w-full bg-white mt-4 lg:mt-0 p-4 sm:p-5 lg:p-8 rounded-md overflow-hidden">
                {!children && (
                  <div className="overflow-hidden">
                    <h2 className="text-xl font-serif font-semibold mb-5">
                      {showingTranslateValue(
                        storeCustomizationSetting?.dashboard?.dashboard_title
                      )}
                    </h2>
                    <div className="grid gap-4 mb-8 md:grid-cols-2 xl:grid-cols-4">
                      <Card
                        title={t('totalOrders')}
                        Icon={FiShoppingCart}
                        quantity={data?.totalDoc}
                        className="text-red-600  bg-red-200"
                      />
                      <Card
                        title={t('pendingOrders')}
                        Icon={FiRefreshCw}
                        quantity={data?.pending}
                        className="text-orange-600 bg-orange-200"
                      />
                      <Card
                        title={t('processingOrders')}
                        Icon={FiTruck}
                        quantity={data?.processing}
                        className="text-indigo-600 bg-indigo-200"
                      />
                      <Card
                        title={t('completeOrders')}
                        Icon={FiCheck}
                        quantity={data?.delivered}
                        className="text-emerald-600 bg-emerald-200"
                      />
                    </div>
                    <RecentOrder data={data} loading={loading} error={error} />
                  </div>
                )}
                {children}
              </div>
            </div>
          </div>
        </Layout>
      )}
    </>
  );
};

export default dynamic(() => Promise.resolve(Dashboard), { ssr: false });
