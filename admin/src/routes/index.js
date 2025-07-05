import { lazy } from "react";
import Promotions from '../pages/Promotions';

const PromotionManagement = lazy(() => import("@/pages/PromotionManagement"));
const ProductImportExport = lazy(() => import("@/pages/ProductImportExport"));
const CategoryImportExport = lazy(() => import("@/pages/CategoryImportExport"));

// use lazy for better code splitting
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Attributes = lazy(() => import("@/pages/Attributes"));
const ChildAttributes = lazy(() => import("@/pages/ChildAttributes"));
const Products = lazy(() => import("@/pages/Products"));
const ProductDetails = lazy(() => import("@/pages/ProductDetails"));
const Category = lazy(() => import("@/pages/Category"));
const ChildCategory = lazy(() => import("@/pages/ChildCategory"));
const Staff = lazy(() => import("@/pages/Staff"));
const Customers = lazy(() => import("@/pages/Customers"));
const CustomerOrder = lazy(() => import("@/pages/CustomerOrder"));
const CustomerLoyalty = lazy(() => import("@/pages/CustomerLoyalty"));
const CustomerDetails = lazy(() => import("@/pages/CustomerDetails"));
const Orders = lazy(() => import("@/pages/Orders"));
const OrderInvoice = lazy(() => import("@/pages/OrderInvoice"));
const Coupons = lazy(() => import("@/pages/Coupons"));
const Units = lazy(() => import("@/pages/Units"));
// const Setting = lazy(() => import("@/pages/Setting"));
const Page404 = lazy(() => import("@/pages/404"));
const ComingSoon = lazy(() => import("@/pages/ComingSoon"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));
const Languages = lazy(() => import("@/pages/Languages"));
const Currencies = lazy(() => import("@/pages/Currencies"));
const Setting = lazy(() => import("@/pages/Setting"));
const StoreHome = lazy(() => import("@/pages/StoreHome"));
const StoreSetting = lazy(() => import("@/pages/StoreSetting"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Banners = lazy(() => import("@/pages/Banners"));
const OdooSync = lazy(() => import("@/pages/OdooSync"));
const OdooCatalog = lazy(() => import("@/pages/OdooCatalog"));
const OdooPromotions = lazy(() => import("@/pages/OdooPromotions"));

// Delivery Management Pages
const DeliveryDashboard = lazy(() => import("@/pages/DeliveryDashboard"));
const OrderAssignments = lazy(() => import("@/pages/OrderAssignments"));
const DeliveryDrivers = lazy(() => import("@/pages/DeliveryDrivers"));
const DeliveryTracking = lazy(() => import("@/pages/DeliveryTracking"));
const DeliverySettings = lazy(() => import("@/pages/DeliverySettings"));

// Reports System Pages
const SalesAnalytics = lazy(() => import("@/pages/Reports/SalesAnalytics"));
const InventoryReports = lazy(() => import("@/pages/Reports/InventoryReports"));
const CustomerInsights = lazy(() => import("@/pages/Reports/CustomerInsights"));
const DeliveryPerformance = lazy(() => import("@/pages/Reports/DeliveryPerformance"));
const FinancialReports = lazy(() => import("@/pages/Reports/FinancialReports"));
const ExecutiveDashboard = lazy(() => import("@/pages/Reports/ExecutiveDashboard"));
/*
//  * ⚠ These are internal routes!
//  * They will be rendered inside the app, using the default `containers/Layout`.
//  * If you want to add a route to, let's say, a landing page, you should add
//  * it to the `App`'s router, exactly like `Login`, `CreateAccount` and other pages
//  * are routed.
//  *
//  * If you're looking for the links rendered in the SidebarContent, go to
//  * `routes/sidebar.js`
 */

const routes = [
  {
    path: "/dashboard",
    component: Dashboard,
  },
  {
    path: "/products",
    component: Products,
  },
  {
    path: "/attributes",
    component: Attributes,
  },
  {
    path: "/attributes/:id",
    component: ChildAttributes,
  },
  {
    path: "/product/:id",
    component: ProductDetails,
  },
  {
    path: "/categories",
    component: Category,
  },
  {
    path: "/languages",
    component: Languages,
  },
  {
    path: "/currencies",
    component: Currencies,
  },
  // IMPORTANT: Specific routes must come before dynamic routes
  {
    path: '/categories/import-export',
    component: CategoryImportExport,
  },
  {
    path: "/categories/:id",
    component: ChildCategory,
  },
  {
    path: "/customers",
    component: Customers,
  },
  {
    path: "/customer-order/:id",
    component: CustomerOrder,
  },
  {
    path: "/customer-loyalty/:id", 
    component: CustomerLoyalty,
  },
  {
    path: "/customer-details/:id",
    component: CustomerDetails,
  },
  {
    path: "/our-staff",
    component: Staff,
  },
  {
    path: "/orders",
    component: Orders,
  },
  {
    path: "/order/:id",
    component: OrderInvoice,
  },
  {
    path: "/coupons",
    component: Coupons,
  },
  { path: "/settings", component: Setting },
  {
    path: "/store/customization",
    component: StoreHome,
  },
  {
    path: "/store/store-settings",
    component: StoreSetting,
  },
  {
    path: "/404",
    component: Page404,
  },
  {
    path: "/coming-soon",
    component: ComingSoon,
  },
  {
    path: "/edit-profile",
    component: EditProfile,
  },
  {
    path: "/notifications",
    component: Notifications,
  },
  {
    path: '/promotions',
    component: Promotions,
  },
  {
    path: '/promotions/manage/:listId',
    component: PromotionManagement,
  },
  {
    path: '/units',
    component: Units,
  },
  {
    path: '/products/import-export',
    component: ProductImportExport,
  },
  {
    path: '/banners',
    component: Banners,
  },
  {
    path: '/odoo-sync',
    component: OdooSync,
  },
  {
    path: '/odoo-catalog',
    component: OdooCatalog,
  },
  {
    path: '/odoo-promotions',
    component: OdooPromotions,
  },
  
  // Delivery Management Routes
  {
    path: '/delivery/dashboard',
    component: DeliveryDashboard,
  },
  {
    path: '/delivery/assignments',
    component: OrderAssignments,
  },
  {
    path: '/delivery/drivers',
    component: DeliveryDrivers,
  },
  {
    path: '/delivery/tracking',
    component: DeliveryTracking,
  },
  {
    path: '/delivery/settings',
    component: DeliverySettings,
  },

  // Reports System Routes
  {
    path: "/reports/sales",
    component: SalesAnalytics,
  },
  {
    path: "/reports/inventory",
    component: InventoryReports,
  },
  {
    path: "/reports/customers",
    component: CustomerInsights,
  },
  {
    path: "/reports/delivery",
    component: DeliveryPerformance,
  },
  {
    path: "/reports/financial",
    component: FinancialReports,
  },
  {
    path: "/reports/executive",
    component: ExecutiveDashboard,
  },
];

// Debug logging
console.log('Routes loaded:', routes.length, 'routes');
console.log('Banner route:', routes.find(r => r.path === '/banners'));
console.log('All routes:', routes.map(r => r.path));

const routeAccessList = [
  // {
  //   label: "Root",
  //   value: "/",
  // },
  { label: "Dashboard", value: "dashboard" },
  { label: "Products", value: "products" },
  { label: "Product Import Export", value: "products/import-export" },
  { label: "Categories", value: "categories" },
  { label: "Category Import Export", value: "categories/import-export" },
  { label: "Attributes", value: "attributes" },
  { label: "Promotions", value: "promotions" },
  { label: "Banners", value: "banners" },
  { label: "Units", value: "units" },
  { label: "Delivery Dashboard", value: "delivery/dashboard" },
  { label: "Order Assignments", value: "delivery/assignments" },
  { label: "Delivery Drivers", value: "delivery/drivers" },
  { label: "Live Tracking", value: "delivery/tracking" },
  { label: "Delivery Settings", value: "delivery/settings" },
  { label: "Coupons", value: "coupons" },
  { label: "Customers", value: "customers" },
  { label: "Orders", value: "orders" },
  { label: "Staff", value: "our-staff" },
  { label: "Settings", value: "settings" },
  { label: "Languages", value: "languages" },
  { label: "Currencies", value: "currencies" },
  { label: "ViewStore", value: "store" },
  { label: "StoreCustomization", value: "customization" },
  { label: "StoreSettings", value: "store-settings" },
  { label: "Product Details", value: "product" },
  { label: "Order Invoice", value: "order" },
  { label: "Edit Profile", value: "edit-profile" },
  {
    label: "Customer Order",
    value: "customer-order",
  },
  { label: "Notification", value: "notifications" },
  { label: "Coming Soon", value: "coming-soon" },
  { label: "Odoo Sync", value: "odoo-sync" },
  { label: "Odoo Catalog", value: "odoo-catalog" },
  { label: "Odoo Promotions", value: "odoo-promotions" },
  { label: "Sales Analytics", value: "reports/sales" },
  { label: "Inventory Reports", value: "reports/inventory" },
  { label: "Customer Insights", value: "reports/customers" },
  { label: "Delivery Performance", value: "reports/delivery" },
  { label: "Financial Reports", value: "reports/financial" },
  { label: "Executive Dashboard", value: "reports/executive" },
];

export { routeAccessList, routes };
