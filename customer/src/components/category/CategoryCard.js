import Image from "next/image";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import {
  IoChevronDownOutline,
  IoChevronForwardOutline,
  IoRemoveSharp,
} from "react-icons/io5";

//internal import
import { SidebarContext } from "@context/SidebarContext";
import useUtilsFunction from "@hooks/useUtilsFunction";

const CategoryCard = ({ title, icon, nested, id }) => {
  const router = useRouter();
  const { closeCategoryDrawer, isLoading, setIsLoading } =
    useContext(SidebarContext);
  const { showingTranslateValue } = useUtilsFunction();

  // react hook
  const [show, setShow] = useState(false); // State to manage expansion of current category
  const [showSubCategory, setShowSubCategory] = useState({
    id: "",
    show: false,
  });

  // handle show category - now toggles expansion for parents, navigates for leaves
  const handleCategoryClick = (categoryId) => {
    if (nested && nested.length > 0) {
      setShow(!show); // Toggle expansion for parent categories
    } else {
      router.push(`/category/${categoryId}`); // Navigate for leaf categories
      closeCategoryDrawer();
      setIsLoading(!isLoading);
    }
  };

  // handle sub nested category (for 2nd level)
  const handleSubNestedCategory = (subCategoryId) => {
    setShowSubCategory((prev) => ({
      id: subCategoryId,
      show: prev.id === subCategoryId ? !prev.show : true,
    }));
    // Only navigate if there are no further nested children
    const subCategory = nested.find(n => n._id === subCategoryId);
    if (!subCategory?.children || subCategory.children.length === 0) {
      router.push(`/category/${subCategoryId}`);
      closeCategoryDrawer();
      setIsLoading(!isLoading);
    }
  };

  // handle sub category (for 3rd level and leaves)
  const handleSubCategory = (subCategoryId) => {
    router.push(`/category/${subCategoryId}`);
    closeCategoryDrawer();
    setIsLoading(!isLoading);
  };

  return (
    <>
      <a
        onClick={() => handleCategoryClick(id)}
        className="p-2 flex items-center rounded-md hover:bg-gray-50 w-full hover:text-emerald-600"
        role="button"
      >
        {icon ? (
          <Image src={icon} width={18} height={18} alt="Category" />
        ) : (
          <Image
            src="https://res.cloudinary.com/dxjobesyt/image/upload/v1752706908/placeholder_kvepfp_wkyfut.png"
            width={18}
            height={18}
            alt="category"
            style={{ width: 'auto', height: 'auto' }}
          />
        )}

        <div className="inline-flex items-center justify-between ml-3 text-sm font-medium w-full hover:text-emerald-600">
          {title}
          {nested?.length > 0 && (
            <span className="transition duration-700 ease-in-out inline-flex loading-none items-end text-gray-400">
              {show ? <IoChevronDownOutline /> : <IoChevronForwardOutline />}
            </span>
          )}
        </div>
      </a>
      {show && nested.length > 0 && (
        <ul className="pl-6 pb-3 pt-1 -mt-1">
          {nested.map((children) => (
            <li key={children._id}>
              {children.children && children.children.length > 0 ? (
                <a
                  onClick={() =>
                    handleSubNestedCategory(children._id)
                  }
                  className="flex items-center font-serif pr-2 text-sm text-gray-600 hover:text-emerald-600 py-1 cursor-pointer"
                >
                  <span className="text-xs text-gray-500">
                    <IoRemoveSharp />
                  </span>

                  <div className="inline-flex items-center justify-between ml-3 text-sm font-medium w-full hover:text-emerald-600">
                    {showingTranslateValue(children.name)}

                    {children.children.length > 0 ? (
                      <span className="transition duration-700 ease-in-out inline-flex loading-none items-end text-gray-400">
                        {showSubCategory.id === children._id &&
                        showSubCategory.show ? (
                          <IoChevronDownOutline />
                        ) : (
                          <IoChevronForwardOutline />
                        )}
                      </span>
                    ) : null}
                  </div>
                </a>
              ) : (
                <a
                  onClick={() =>
                    handleSubCategory(children._id)
                  }
                  className="flex items-center font-serif py-1 text-sm text-gray-600 hover:text-emerald-600 cursor-pointer"
                >
                  <span className="text-xs text-gray-500 pr-2">
                    <IoRemoveSharp />
                  </span>
                  {showingTranslateValue(children.name)}
                </a>
              )}

              {/* sub children category */}
              {showSubCategory.id === children._id &&
              showSubCategory.show === true ? (
                <ul className="pl-6 pb-3">
                  {children.children.map((subChildren) => (
                    <li key={subChildren._id}>
                      <a
                        onClick={() =>
                          handleSubCategory(subChildren._id)
                        }
                        className="flex items-center font-serif py-1 text-sm text-gray-600 hover:text-emerald-600 cursor-pointer"
                      >
                        <span className="text-xs text-gray-500 pr-2">
                          <IoRemoveSharp />
                        </span>
                        {showingTranslateValue(subChildren?.name)}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default CategoryCard;
