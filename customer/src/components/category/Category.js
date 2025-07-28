import { useContext, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { IoClose } from "react-icons/io5";
import { useQuery } from "@tanstack/react-query";
import { IoChevronDown, IoChevronForward } from "react-icons/io5";
import { IoHomeOutline, IoBagOutline, IoGiftOutline, IoInformationCircleOutline, IoDocumentTextOutline, IoShieldCheckmarkOutline, IoHelpCircleOutline, IoPersonCircleOutline } from "react-icons/io5";

//internal import
import Loading from "@components/preloader/Loading";
import { SidebarContext } from "@context/SidebarContext";
import CategoryServices from "@services/CategoryServices";
import ProductServices from "@services/ProductServices";
import CategoryCard from "@components/category/CategoryCard";
import useUtilsFunction from "@hooks/useUtilsFunction";
import useTranslation from "next-translate/useTranslation";

const Category = () => {
  const { categoryDrawerOpen, closeCategoryDrawer } = useContext(SidebarContext);
  const { showingTranslateValue } = useUtilsFunction();
  const { t } = useTranslation("common");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const { data, error, isLoading, isFetched } = useQuery({
    queryKey: ["category"],
    queryFn: async () => await CategoryServices.getShowingCategory(),
  });
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const filterCategoriesWithProducts = async () => {
      setLoading(true);
      try {
        const mainCategories = data?.filter(
          (cat) => !cat.parentId || cat.parentId === "62c827b5a427b63741da9175"
        ) || [];
        const categoriesWithProducts = [];
        for (const category of mainCategories) {
          const hasMainCategoryProducts = await ProductServices.checkCategoryHasProducts(category._id);
          let hasSubcategoryProducts = false;
          if (category.children && category.children.length > 0) {
            for (const subcategory of category.children) {
              const hasSubProducts = await ProductServices.checkCategoryHasProducts(subcategory._id);
              if (hasSubProducts) {
                hasSubcategoryProducts = true;
                break;
              }
            }
          }
          if (hasMainCategoryProducts || hasSubcategoryProducts) {
            if (category.children && category.children.length > 0) {
              const filteredSubcategories = [];
              for (const subcategory of category.children) {
                const hasSubProducts = await ProductServices.checkCategoryHasProducts(subcategory._id);
                if (hasSubProducts) {
                  filteredSubcategories.push(subcategory);
                }
              }
              category.children = filteredSubcategories;
            }
            categoriesWithProducts.push(category);
          }
        }
        setFilteredCategories(categoriesWithProducts);
      } catch (error) {
        setFilteredCategories([]);
      } finally {
        setLoading(false);
      }
    };
    if (data) filterCategoriesWithProducts();
  }, [data]);

  // Define internal pages as a fallback if @utils/data is not correctly structured or found
  const pages = [
    { titleKey: "HOME", href: "/", icon: <IoHomeOutline className="text-lg ml-2" /> },
    { titleKey: "Products", href: "/products", icon: <IoBagOutline className="text-lg ml-2" /> },
    { titleKey: "Promotions", href: "/promotions", icon: <IoGiftOutline className="text-lg ml-2" /> },
    { titleKey: "About Us", href: "/about-us", icon: <IoInformationCircleOutline className="text-lg ml-2" /> },
    { titleKey: "Terms & Conditions", href: "/terms-and-conditions", icon: <IoDocumentTextOutline className="text-lg ml-2" /> },
    { titleKey: "Privacy Policy", href: "/privacy-policy", icon: <IoShieldCheckmarkOutline className="text-lg ml-2" /> },
    { titleKey: "FAQ", href: "/faq", icon: <IoHelpCircleOutline className="text-lg ml-2" /> },
    { titleKey: "My account", href: "/user/dashboard", icon: <IoPersonCircleOutline className="text-lg ml-2" /> },
  ];

  return (
    <div className="flex flex-col w-full h-full bg-white cursor-pointer scrollbar-hide">
      {categoryDrawerOpen && (
        <div className="w-full flex justify-between items-center h-16 px-6 py-4 bg-green-600 text-white border-b border-gray-100">
          <h2 className="font-semibold font-serif text-lg m-0 text-heading flex align-center">
            <Link href="/" className="mr-10">
              <Image
                width={60}
                height={22}
                src="/logo/logo-light.svg"
                alt="logo"
              />
            </Link>
          </h2>
          <button
            onClick={closeCategoryDrawer}
            className="flex text-xl items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-red-500 p-2 focus:outline-none transition-opacity hover:text-red-600"
            aria-label="close"
          >
            <IoClose />
          </button>
        </div>
      )}
      <div className="w-full max-h-full">
        {/* New Pages Section */}
        <div className="relative grid gap-2 mt-2">
          {/* Removed Pages header */}
          <div className="relative grid gap-1 p-6">
            {pages.map((item) => (
              <Link
                key={item.titleKey}
                href={item.href}
                className="p-2 flex font-serif items-center rounded-md hover:bg-gray-50 w-full hover:text-emerald-600"
                onClick={closeCategoryDrawer}
              >
                <span className="flex items-center w-full">
                  {item.icon}
                  <span className="text-sm font-medium w-full hover:text-emerald-600">
                    {t(item.titleKey)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Categories Section (Collapsible) */}
        <div className="relative grid gap-2 mt-2">
          <button
            className="w-full flex items-center justify-between border-b px-8 py-3 bg-transparent focus:outline-none"
            onClick={() => setCategoriesOpen((open) => !open)}
            aria-expanded={categoriesOpen}
            aria-controls="category-list"
          >
            <h2 className="font-semibold font-serif text-lg m-0 text-heading flex align-center">
              {t("Categories")}
          </h2>
            {categoriesOpen ? (
              <IoChevronDown className="text-xl" />
            ) : (
              <IoChevronForward className="text-xl" />
            )}
          </button>
          {categoriesOpen && (
            loading ? (
              <Loading loading={loading} />
            ) : error ? (
              <p className="flex justify-center align-middle items-center m-auto text-xl text-red-500">
                {error?.response?.data?.message || error?.message}
              </p>
            ) : (
              <div className="relative grid gap-2 p-6" id="category-list">
                {filteredCategories?.map((category) => (
                  <CategoryCard
                    key={category._id}
                    id={category._id}
                    icon={category.icon}
                    nested={category.children || []}
                    title={showingTranslateValue(category?.name)}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Category;
