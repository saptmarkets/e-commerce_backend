import Link from "next/link";
// import dayjs from "dayjs";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import dynamic from "next/dynamic";
import { IoLockOpenOutline } from "react-icons/io5";
import { FiPhoneCall, FiUser, FiTruck } from "react-icons/fi";
import { jwtDecode } from "jwt-decode";
import { useEffect, useContext } from "react";
import useTranslation from "next-translate/useTranslation"; // Corrected import

//internal import
import { getUserSession } from "@lib/auth";
import useGetSetting from "@hooks/useGetSetting";
import useUtilsFunction from "@hooks/useUtilsFunction";
import useLoginSubmit from "@hooks/useLoginSubmit";
import { UserContext } from "@context/UserContext";

const NavBarTop = () => {
  // Use userInfo from context for reactivity
  const { state, dispatch } = useContext(UserContext);
  const userInfo = state.userInfo;
  const router = useRouter();
  const { handleLogout } = useLoginSubmit();
  const { t } = useTranslation("common"); // Use common namespace for translations

  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();

  const handleLogOut = () => {
    handleLogout();
  };

  useEffect(() => {
    if (userInfo) {
      const decoded = jwtDecode(userInfo?.token);

      const expireTime = new Date(decoded?.exp * 1000);
      const currentTime = new Date();

      // console.log(
      //   // decoded,
      //   "expire",
      //   dayjs(expireTime).format("DD, MMM, YYYY, h:mm A"),
      //   "currentTime",
      //   dayjs(currentTime).format("DD, MMM, YYYY, h:mm A")
      // );
      if (currentTime >= expireTime) {
        console.log("token expire, should sign out now..");
        handleLogOut();
      }
    }
  }, [userInfo]);

  return (
    <>
      <div className="hidden lg:block bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10 text-sm">
            
            {/* Left - Phone & Help Text */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center text-gray-600">
                <FiPhoneCall className="w-4 h-4 mr-2" style={{ color: "#76bd44" }} />
                <span className="hidden sm:inline">
                  {t("common:helpText")}
                </span>
                <a
                  href={`tel:${storeCustomizationSetting?.navbar?.phone || "+099949343"}`}
                  className="font-semibold ml-1 hover:underline transition-colors"
                  style={{ color: "#74338c" }}
                >
                  {storeCustomizationSetting?.navbar?.phone || "+099949343"}
                </a>
              </div>
            </div>
            
            {/* Center - Fast Delivery */}
            <div className="flex items-center text-gray-600">
              <FiTruck className="w-4 h-4 mr-2" style={{ color: "#76bd44" }} />
              <span className="font-medium" style={{ color: "#74338c" }}>{t("common:Fast delivery within city")}</span>
            </div>
            
            {/* Right - Navigation Links */}
            <div className="flex items-center gap-x-2">
              {storeCustomizationSetting?.navbar?.about_menu_status && (
                <Link
                  href="/about-us"
                  className="bg-gray-100 border border-gray-200 rounded px-3 py-1 text-gray-600 hover:text-purple-600 transition-colors font-medium flex items-center min-w-max"
                >
                  {t("common:About Us")}
                </Link>
              )}
              {storeCustomizationSetting?.navbar?.contact_menu_status && (
                <Link
                  href="/contact-us"
                  className="bg-gray-100 border border-gray-200 rounded px-3 py-1 text-gray-600 hover:text-purple-600 transition-colors font-medium flex items-center min-w-max"
                >
                  {t("common:Contact Us")}
                </Link>
              )}
              {storeCustomizationSetting?.navbar?.privacy_policy_status && (
                <Link
                  href="/privacy-policy"
                  className="bg-gray-100 border border-gray-200 rounded px-3 py-1 text-gray-600 hover:text-purple-600 transition-colors font-medium flex items-center min-w-max"
                >
                  {t("common:Privacy Policy")}
                </Link>
              )}
              {storeCustomizationSetting?.navbar?.term_and_condition_status && (
                <Link
                  href="/terms-and-conditions"
                  className="bg-gray-100 border border-gray-200 rounded px-3 py-1 text-gray-600 hover:text-purple-600 transition-colors font-medium flex items-center min-w-max"
                >
                  {t("common:Terms & Conditions")}
                </Link>
              )}

              <Link
                href="/user/my-account"
                className="bg-gray-100 border border-gray-200 rounded px-3 py-1 text-gray-600 hover:text-purple-600 transition-colors font-medium flex items-center min-w-max"
              >
                {t("common:My account")}
              </Link>
              {userInfo?.email ? (
                <div className="flex items-center gap-x-2">
                  <span className="text-gray-600 bg-gray-200 border border-gray-200 rounded px-3 py-1 min-w-max">{t("common:Welcome")}, {userInfo.name || userInfo.email}</span>
                  <button
                    onClick={handleLogOut}
                    className="flex items-center bg-gray-200 border border-gray-200 rounded px-3 py-1 text-gray-600 hover:text-purple-600 transition-colors font-medium min-w-max"
                  >
                    <IoLockOpenOutline className="w-4 h-4 mr-1" />
                    {t("common:logout")}
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center bg-gray-100 border border-gray-200 rounded px-3 py-1 text-gray-600 hover:text-purple-600 transition-colors font-medium min-w-max"
                >
                  <FiUser className="w-4 h-4 mr-1" />
                  {t("common:Login")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default dynamic(() => Promise.resolve(NavBarTop), { ssr: false });