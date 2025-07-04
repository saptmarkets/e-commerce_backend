import React, { useState } from "react";
import { Input } from "@windmill/react-ui";
import Tree from "rc-tree";
import useUtilsFunction from "@/hooks/useUtilsFunction";

const ProductCategorySelector = ({ 
  categories, 
  categoriesLoading, 
  selectedCategory, 
  onCategorySelect, 
  register, 
  errors 
}) => {
  const [isTreeOpen, setIsTreeOpen] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const { showingTranslateValue } = useUtilsFunction();

  const STYLE = `
  .rc-tree-child-tree {
    display: block;
  }
  .node-motion {
    transition: all .3s;
    overflow-y: hidden;
  }
`;

  const motion = {
    motionName: "node-motion",
    motionAppear: false,
    onAppearStart: (node) => {
      return { height: 0 };
    },
    onAppearActive: (node) => ({ height: node.scrollHeight }),
    onLeaveStart: (node) => ({ height: node.offsetHeight }),
    onLeaveActive: () => ({ height: 0 }),
  };

  const renderCategories = (categories) => {
    let myCategories = [];
    for (let category of categories) {
      myCategories.push({
        title: showingTranslateValue(category.name),
        key: category._id,
        children:
          category?.children?.length > 0 && renderCategories(category.children),
      });
    }
    return myCategories;
  };

  const findObject = (obj, target) => {
    if (obj._id === target) return obj;
    if (obj?.children?.length > 0) {
      for (let child of obj.children) {
        const result = findObject(child, target);
        if (result) return result;
      }
    }
    return null;
  };

  const findCategoryInData = (target) => {
    for (let category of categories) {
      const result = findObject(category, target);
      if (result) return result;
    }
    return null;
  };

  const handleSelect = (key) => {
    if (!key) return;
    
    const result = findCategoryInData(key);
    if (result) {
      const categoryName = showingTranslateValue(result.name);
      setSelectedCategoryName(categoryName);
      onCategorySelect(result._id);
      setIsTreeOpen(false);
    }
  };

  // Update selected category name when selectedCategory prop changes
  React.useEffect(() => {
    if (selectedCategory && categories?.length > 0) {
      const result = findCategoryInData(selectedCategory);
      if (result) {
        setSelectedCategoryName(showingTranslateValue(result.name));
      }
    }
  }, [selectedCategory, categories]);

  return (
    <div className="relative">
      <Input
        {...register("category", {
          required: "Category is required!",
        })}
        name="category"
        value={selectedCategoryName || ""}
        placeholder="Select Category"
        type="text"
        readOnly
        onClick={() => setIsTreeOpen(!isTreeOpen)}
        className="border h-9 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white cursor-pointer"
      />
      
      {errors?.category && (
        <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
      )}

      {isTreeOpen && !categoriesLoading && categories?.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-3">
            <div className="draggable-demo capitalize">
              <style dangerouslySetInnerHTML={{ __html: STYLE }} />
              <Tree
                expandAction="click"
                treeData={renderCategories(categories)}
                selectedKeys={selectedCategory ? [selectedCategory] : []}
                onSelect={(keys) => handleSelect(keys[0])}
                motion={motion}
                animation="slide-up"
              />
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close tree */}
      {isTreeOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsTreeOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductCategorySelector; 