import React, { useContext, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { FiPlus, FiDownload, FiUpload, FiSearch } from "react-icons/fi";
import { FiEdit, FiTrash2 } from "react-icons/fi";

//internal import
import useAsync from "@/hooks/useAsync";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import UploadMany from "@/components/common/UploadMany";
import NotFound from "@/components/table/NotFound";
import ProductServices from "@/services/ProductServices";
import PageTitle from "@/components/Typography/PageTitle";
import { SidebarContext } from "@/context/SidebarContext";
import ProductTable from "@/components/product/ProductTable";
import MainDrawer from "@/components/drawer/MainDrawer";
import ProductDrawer from "@/components/drawer/ProductDrawer";
import CheckBox from "@/components/form/others/CheckBox";
import useProductFilter from "@/hooks/useProductFilter";
import DeleteModal from "@/components/modal/DeleteModal";
import BulkActionDrawer from "@/components/drawer/BulkActionDrawer";
import TableLoading from "@/components/preloader/TableLoading";
import SelectCategory from "@/components/form/selectOption/SelectCategory";
import AnimatedContent from "@/components/common/AnimatedContent";
import { 
  SimpleTable, 
  SimpleTableHeader, 
  SimpleTableCell, 
  SimpleTableFooter, 
  SimpleTableContainer,
  SimpleTableRow,
  SimpleTableHeaderCell,
  SimpleTableBody,
  SimplePagination
} from "@/components/table/SimpleTable";

const Products = () => {
  const { title, allId, serviceId, handleDeleteMany, handleUpdateMany } =
    useToggleDrawer();

  const { t } = useTranslation();
  const history = useHistory();
  const {
    toggleDrawer,
    lang,
    currentPage,
    handleChangePage,
    searchText,
    category,
    setCategory,
    searchRef,
    handleSubmitForAll,
    sortedField,
    setSortedField,
    limitData,
  } = useContext(SidebarContext);

  const { data, loading, error } = useAsync(() =>
    ProductServices.getAllProducts({
      page: currentPage,
      limit: limitData,
      category: category,
      title: searchText,
      price: sortedField,
      searchType: searchType,
    })
  );

  // react hooks
  const [isCheckAll, setIsCheckAll] = useState(false);
  const [isCheck, setIsCheck] = useState([]);
  const [searchType, setSearchType] = useState("all"); // all, barcode, sku, name
  const [searchValue, setSearchValue] = useState("");

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== searchText) {
        // Update search text when debounced value changes
        searchRef.current.value = searchValue;
        handleSubmitForAll({ preventDefault: () => {} });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    setSearchValue(e.target.value);
  }, []);

  const handleSelectAll = () => {
    setIsCheckAll(!isCheckAll);
    setIsCheck(data?.products.map((li) => li._id));
    if (isCheckAll) {
      setIsCheck([]);
    }
  };
  
  // handle reset field
  const handleResetField = () => {
    setCategory("");
    setSortedField("");
    setSearchType("all");
    setSearchValue("");
    searchRef.current.value = "";
  };

  const {
    serviceData,
    filename,
    isDisabled,
    handleSelectFile,
    handleUploadMultiple,
    handleRemoveSelectFile,
  } = useProductFilter(data?.products);

  return (
    <>
      <PageTitle>{t("ProductsPage")}</PageTitle>
      <DeleteModal ids={allId} setIsCheck={setIsCheck} title={title} />
      <BulkActionDrawer ids={allId} title={t("Products")} />
      <MainDrawer>
        <ProductDrawer id={serviceId} />
      </MainDrawer>
      <AnimatedContent>
        <div className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5 rounded-lg">
          <div className="p-4">
            <form
              onSubmit={handleSubmitForAll}
              className="py-3 md:pb-0 grid gap-4 lg:gap-6 xl:gap-6 xl:flex"
            >
              <div className="flex-grow-0 sm:flex-grow md:flex-grow lg:flex-grow xl:flex-grow">
                <UploadMany
                  title={t("Products")}
                  filename={filename}
                  isDisabled={isDisabled}
                  totalDoc={data?.totalDoc}
                  handleSelectFile={handleSelectFile}
                  handleUploadMultiple={handleUploadMultiple}
                  handleRemoveSelectFile={handleRemoveSelectFile}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
                  <button
                    type="button"
                    disabled={isCheck.length < 1}
                    onClick={() => handleUpdateMany(isCheck)}
                    className="w-full rounded-md h-12 btn-gray text-gray-600 bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium"
                  >
                    <span className="mr-2">
                      <FiEdit />
                    </span>
                    {t("BulkAction")}
                  </button>
                </div>
                <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
                  <button
                    type="button"
                    disabled={isCheck?.length < 1}
                    onClick={() => handleDeleteMany(isCheck, data.products)}
                    className="w-full rounded-md h-12 bg-red-300 disabled:opacity-50 disabled:cursor-not-allowed text-red-700 px-4 py-2 text-sm font-medium"
                  >
                    <span className="mr-2">
                      <FiTrash2 />
                    </span>
                    {t("Delete")}
                  </button>
                </div>
                <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
                  <button
                    type="button"
                    onClick={() => history.push('/products/import-export')}
                    className="w-full rounded-md h-12 bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    <span className="mr-2">
                      <FiUpload />
                    </span>
                    {t("ImportExport")}
                  </button>
                </div>
                <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
                  <button
                    type="button"
                    onClick={toggleDrawer}
                    className="w-full rounded-md h-12 bg-blue-500 text-white px-4 py-2 text-sm font-medium"
                  >
                    <span className="mr-2">
                      <FiPlus />
                    </span>
                    {t("AddProduct")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 rounded-t-lg rounded-0 mb-4">
          <div className="p-4">
            <form
              onSubmit={handleSubmitForAll}
              className="py-3 grid gap-4 lg:gap-6 xl:gap-6 md:flex xl:flex"
            >
              <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    ) : (
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    ref={searchRef}
                    type="search"
                    name="search"
                    value={searchValue}
                    onChange={handleSearchChange}
                    placeholder="Search by name (EN/AR), barcode, SKU, ID, brand..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
                <SelectCategory setCategory={setCategory} lang={lang} />
              </div>

              <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                >
                  <option value="all">All Fields</option>
                  <option value="name">Name Only</option>
                  <option value="barcode">Barcode Only</option>
                  <option value="sku">SKU Only</option>
                  <option value="id">Product ID</option>
                </select>
              </div>

              <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
                <select
                  onChange={(e) => setSortedField(e.target.value)}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                >
                  <option value="All" defaultValue hidden>
                    {t("Price")}
                  </option>
                  <option value="low">{t("LowtoHigh")}</option>
                  <option value="high">{t("HightoLow")}</option>
                  <option value="published">{t("Published")}</option>
                  <option value="unPublished">{t("Unpublished")}</option>
                  <option value="status-selling">{t("StatusSelling")}</option>
                  <option value="status-out-of-stock">{t("StatusStock")}</option>
                  <option value="date-added-asc">{t("DateAddedAsc")}</option>
                  <option value="date-added-desc">{t("DateAddedDesc")}</option>
                  <option value="date-updated-asc">{t("DateUpdatedAsc")}</option>
                  <option value="date-updated-desc">{t("DateUpdatedDesc")}</option>
                </select>
              </div>
              <div className="flex items-center gap-2 flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
                <div className="w-full mx-1">
                  <button
                    type="submit"
                    className="h-12 w-full bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {t("Filter")}
                  </button>
                </div>

                <div className="w-full mx-1">
                  <button
                    onClick={handleResetField}
                    type="reset"
                    className="px-4 md:py-1 py-2 h-12 text-sm dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:text-gray-200"
                  >
                    {t("Reset")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </AnimatedContent>

      {loading ? (
        <TableLoading row={12} col={7} width={160} height={20} />
      ) : error ? (
        <span className="text-center mx-auto text-red-500">{error}</span>
      ) : data?.products?.length > 0 ? (
        <SimpleTableContainer className="mb-8 rounded-b-lg">
          <SimpleTable>
            <SimpleTableHeader>
              <SimpleTableRow>
                <SimpleTableHeaderCell>
                  <CheckBox
                    type="checkbox"
                    name="selectAll"
                    id="selectAll"
                    isChecked={isCheckAll}
                    handleClick={handleSelectAll}
                  />
                </SimpleTableHeaderCell>
                <SimpleTableHeaderCell>{t("ProductNameTbl")}</SimpleTableHeaderCell>
                <SimpleTableHeaderCell>{t("CategoryTbl")}</SimpleTableHeaderCell>
                <SimpleTableHeaderCell>
                  <div className="flex items-center">
                    {t("PriceTbl")}
                    <span className="ml-1 text-xs text-gray-500" title="Base unit price">
                      (Base)
                    </span>
                  </div>
                </SimpleTableHeaderCell>
                <SimpleTableHeaderCell>
                  <div className="flex items-center">
                    {t("StockTbl")} <span className="ml-1 text-xs text-gray-500">(Total)</span>
                  </div>
                </SimpleTableHeaderCell>
                <SimpleTableHeaderCell>{t("StatusTbl")}</SimpleTableHeaderCell>
                <SimpleTableHeaderCell className="text-center">{t("DetailsTbl")}</SimpleTableHeaderCell>
                <SimpleTableHeaderCell className="text-center">{t("PublishedTbl")}</SimpleTableHeaderCell>
                <SimpleTableHeaderCell className="text-right">{t("ActionsTbl")}</SimpleTableHeaderCell>
              </SimpleTableRow>
            </SimpleTableHeader>
            <ProductTable
              lang={lang}
              isCheck={isCheck}
              products={data?.products}
              setIsCheck={setIsCheck}
            />
          </SimpleTable>
          <SimpleTableFooter>
            <SimplePagination
              totalResults={data?.totalDoc}
              resultsPerPage={limitData}
              onChange={handleChangePage}
              currentPage={currentPage}
            />
          </SimpleTableFooter>
        </SimpleTableContainer>
      ) : (
        <NotFound title={t("Product")} />
      )}
    </>
  );
};

export default Products;
