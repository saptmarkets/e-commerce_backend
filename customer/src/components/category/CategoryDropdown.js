import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { IoChevronForward } from "react-icons/io5";
import useUtilsFunction from "@hooks/useUtilsFunction";
import CategoryServices from "@services/CategoryServices";
import ProductServices from "@services/ProductServices";
import { useEffect, useState } from "react";

const CategoryDropdown = () => {
  const { showingTranslateValue } = useUtilsFunction();
  const { data, error, isLoading } = useQuery({
    queryKey: ["category"],
    queryFn: async () => await CategoryServices.getShowingCategory(),
  });
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

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

  const toggleExpand = (categoryId) => {
    setExpanded((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  return (
    <div className="p-4">
      {isLoading || loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error?.message || "Error loading categories"}</div>
      ) : (
        <ul className="space-y-2">
          {filteredCategories.map((category) => (
            <li key={category._id} className="group">
              <div className="flex items-center justify-between px-2 py-2 rounded hover:bg-gray-50 transition-colors">
                <Link href={`/category/${category.slug || category._id}`} className="flex items-center flex-1 min-w-0">
                  {category.icon && (
                    <Image src={category.icon} alt={showingTranslateValue(category.name)} width={24} height={24} className="mr-2 object-contain" />
                  )}
                  <span className="truncate">{showingTranslateValue(category.name)}</span>
                </Link>
                {category.children && category.children.length > 0 && (
                  <button
                    onClick={() => toggleExpand(category._id)}
                    className="ml-2 p-1 focus:outline-none"
                    aria-label={expanded[category._id] ? "Collapse" : "Expand"}
                  >
                    <IoChevronForward
                      className={`text-gray-400 group-hover:text-green-600 transition-transform duration-200 ${expanded[category._id] ? "rotate-90" : ""}`}
                    />
                  </button>
                )}
              </div>
              {category.children && category.children.length > 0 && expanded[category._id] && (
                <ul className="ml-8 mt-1 space-y-1">
                  {category.children.map((subcat) => (
                    <li key={subcat._id}>
                      <Link href={`/category/${subcat.slug || subcat._id}`} className="flex items-center px-2 py-1 rounded hover:bg-gray-100 text-sm">
                        {subcat.icon && (
                          <Image src={subcat.icon} alt={showingTranslateValue(subcat.name)} width={20} height={20} className="mr-2 object-contain" />
                        )}
                        <span className="truncate">{showingTranslateValue(subcat.name)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CategoryDropdown; 