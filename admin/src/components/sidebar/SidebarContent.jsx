import React, { useContext, useState } from "react";
import { NavLink, Route } from "react-router-dom";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import { Button, WindmillContext } from "@windmill/react-ui";
import { IoLogOutOutline } from "react-icons/io5";

//internal import
import sidebar from "@/routes/sidebar";
// import SidebarSubMenu from "SidebarSubMenu";
import logoDark from "@/assets/img/logo/logo-color.svg";
import logoLight from "@/assets/img/logo/logo-dark.svg";
import { AdminContext } from "@/context/AdminContext";
import SidebarSubMenu from "@/components/sidebar/SidebarSubMenu";
import useGetCData from "@/hooks/useGetCData";

const SidebarContent = () => {
  const { t } = useTranslation();
  const { mode } = useContext(WindmillContext);
  const { dispatch, state } = useContext(AdminContext);
  const { adminInfo } = state;
  const { accessList, role } = useGetCData();

  const handleLogOut = () => {
    dispatch({ type: "USER_LOGOUT" });
    Cookies.remove("adminInfo");
  };

  // Check if user is Super Admin
  const isSuperAdmin = role === "Super Admin" || adminInfo?.role === "Super Admin";

  console.log("Sidebar access check:", {
    accessList,
    role,
    adminRole: adminInfo?.role,
    isSuperAdmin
  });

  const updatedSidebar = sidebar
    .map((route) => {
      // Super Admin gets access to everything
      if (isSuperAdmin) {
        return route;
      }

      // Filter sub-routes if they exist
      if (route.routes) {
        const validSubRoutes = route.routes.filter((subRoute) => {
          const routeKey = subRoute.path.split("?")[0].split("/")[1];
          const fullRouteKey = subRoute.path.split("?")[0].substring(1); // Remove leading slash
          return accessList?.includes(routeKey) || accessList?.includes(fullRouteKey);
        });

        // Only include the route if it has valid sub-routes
        if (validSubRoutes.length > 0) {
          return { ...route, routes: validSubRoutes };
        }
        return null; // Exclude the main route if no sub-routes are valid
      }
      // Handle top-level route: check root path part
      const routeKey = route.path?.split("?")[0].split("/")[1];
      return routeKey && accessList?.includes(routeKey) ? route : null;
    })
    .filter(Boolean);

  // Debug logging for troubleshooting
  console.log("Sidebar filtering result:", {
    originalSidebarLength: sidebar.length,
    filteredSidebarLength: updatedSidebar.length,
    isSuperAdmin,
    accessList,
    catalogRoute: updatedSidebar.find(route => route.name === "Catalog")
  });

  return (
    <div className="sidebar py-4 text-gray-500 dark:text-gray-400">
      <a className=" text-gray-900 dark:text-gray-200" href="/dashboard">
        {mode === "dark" ? (
          <img src={logoLight} alt="saptmarkets" width="135" className="pl-6" />
        ) : (
          <img src={logoDark} alt="saptmarkets" width="135" className="pl-6" />
        )}
      </a>
      <ul className="mt-8">
        {updatedSidebar?.map((route) =>
          route.routes ? (
            <SidebarSubMenu route={route} key={route.name} />
          ) : (
            <li className="relative" key={route.name}>
              <NavLink
                exact
                to={route.path}
                target={`${route?.outside ? "_blank" : "_self"}`}
                className="px-6 py-4 inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:text-emerald-700 dark:hover:text-gray-200"
                // activeClassName="text-emerald-500 dark:text-gray-100"
                activeStyle={{
                  color: "#0d9e6d",
                }}
                rel="noreferrer"
              >
                <Route path={route.path} exact={route.exact}>
                  <span
                    className="absolute inset-y-0 left-0 w-1 bg-emerald-500 rounded-tr-lg rounded-br-lg"
                    aria-hidden="true"
                  ></span>
                </Route>
                <route.icon className="w-5 h-5" aria-hidden="true" />
                <span className="ml-4">{t(`${route.name}`)}</span>
              </NavLink>
            </li>
          )
        )}
      </ul>
      <span className="lg:fixed bottom-0 px-6 py-6 w-64 mx-auto relative mt-3 block">
        <Button onClick={handleLogOut} size="large" className="w-full">
          <span className="flex items-center">
            <IoLogOutOutline className="mr-3 text-lg" />
            <span className="text-sm">{t("LogOut")}</span>
          </span>
        </Button>
      </span>
    </div>
  );
};

export default SidebarContent;
