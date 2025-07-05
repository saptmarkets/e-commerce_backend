import {
  FiGrid,
  FiUsers,
  FiUser,
  FiCompass,
  FiSettings,
  FiSlack,
  FiGlobe,
  FiTarget,
  FiTag,
  FiTruck,
  FiRefreshCw,
  FiBarChart,
} from "react-icons/fi";

/**
 * ⚠ These are used just to render the Sidebar!
 * You can include any link here, local or external.
 *
 * If you're looking to actual Router routes, go to
 * `routes/index.js`
 */
const sidebar = [
  {
    path: "/dashboard", // the url
    icon: FiGrid, // icon
    name: "Dashboard", // name that appear in Sidebar
  },

  {
    icon: FiSlack,
    name: "Catalog",
    routes: [
      {
        path: "/products",
        name: "Products",
      },
      {
        path: "/products/import-export",
        name: "Product Import/Export",
      },
      {
        path: "/categories",
        name: "Categories",
      },
      {
        path: "/categories/import-export",
        name: "Category Import/Export",
      },
      {
        path: "/attributes",
        name: "Attributes",
      },
      {
        path: "/units",
        name: "Units",
      },
      {
        path: "/promotions",
        name: "Promotions",
      },
      {
        path: "/banners",
        name: "Banners",
      },
      {
        path: "/coupons",
        name: "Coupons",
      },
    ],
  },

  {
    icon: FiRefreshCw,
    name: "Odoo Management",
    routes: [
      {
        path: "/odoo-sync",
        name: "Odoo Sync",
      },
      {
        path: "/odoo-catalog",
        name: "Product Catalog",
      },
      {
        path: "/odoo-promotions",
        name: "Promotions (Pricelist)",
      },
    ],
  },

  {
    path: "/customers",
    icon: FiUsers,
    name: "Customers",
  },
  {
    path: "/orders",
    icon: FiCompass,
    name: "Orders",
  },

  {
    icon: FiBarChart,
    name: "Reports",
    routes: [
      {
        path: "/reports/sales",
        name: "Sales Analytics",
      },
      {
        path: "/reports/inventory", 
        name: "Inventory Reports",
      },
      {
        path: "/reports/customers",
        name: "Customer Insights",
      },
      {
        path: "/reports/delivery",
        name: "Delivery Performance",
      },
      {
        path: "/reports/financial",
        name: "Financial Reports",
      },
      {
        path: "/reports/executive",
        name: "Executive Dashboard",
      },
    ],
  },

  {
    icon: FiUser,
    name: "OurStaff",
    routes: [
      {
        path: "/our-staff",
        name: "Staff Management",
      },
      {
        path: "/delivery/dashboard",
        name: "Delivery Dashboard",
      },
      {
        path: "/delivery/drivers",
        name: "Manage Drivers",
      },
      {
        path: "/delivery/assignments",
        name: "Order Assignments",
      },
      {
        path: "/delivery/tracking",
        name: "Live Tracking",
      },
      {
        path: "/delivery/settings",
        name: "Delivery Settings",
      },
    ],
  },

  {
    path: "/settings?settingTab=common-settings",
    icon: FiSettings,
    name: "Settings",
  },
  {
    icon: FiGlobe,
    name: "International",
    routes: [
      {
        path: "/languages",
        name: "Languages",
      },
      {
        path: "/currencies",
        name: "Currencies",
      },
    ],
  },
  {
    icon: FiTarget,
    name: "OnlineStore",
    routes: [
      {
        name: "ViewStore",
        path: "/store",
        outside: "store",
      },

      {
        path: "/store/customization",
        name: "StoreCustomization",
      },
      {
        path: "/store/store-settings",
        name: "StoreSettings",
      },
    ],
  },

  {
    icon: FiSlack,
    name: "Pages",
    routes: [
      // submenu

      {
        path: "/404",
        name: "404",
      },
      {
        path: "/coming-soon",
        name: "Coming Soon",
      },
    ],
  },
];

export default sidebar; 