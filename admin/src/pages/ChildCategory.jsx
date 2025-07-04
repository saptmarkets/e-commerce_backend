import {
  Button,
  Card,
  CardBody,
  Pagination,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
} from "@windmill/react-ui";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiChevronRight, FiEdit, FiPlus, FiTrash2 } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";

//internal import
import CategoryTable from "@/components/category/CategoryTable";
import BulkActionDrawer from "@/components/drawer/BulkActionDrawer";
import CheckBox from "@/components/form/others/CheckBox";
import DeleteModal from "@/components/modal/DeleteModal";
import Loading from "@/components/preloader/Loading";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { SidebarContext } from "@/context/SidebarContext";
import useAsync from "@/hooks/useAsync";
import useFilter from "@/hooks/useFilter";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import CategoryServices from "@/services/CategoryServices";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import AnimatedContent from "@/components/common/AnimatedContent";

const ChildCategory = () => {
  const { id } = useParams();
  const [childCategory, setChildCategory] = useState([]);
  const [selectedObj, setSelectObj] = useState([]);
  const [isCheckAll, setIsCheckAll] = useState(false);
  const [isCheck, setIsCheck] = useState([]);

  const { toggleDrawer, lang } = useContext(SidebarContext);
  const { handleDeleteMany, allId, handleUpdateMany } = useToggleDrawer();
  const { data, loading, error } = useAsync(CategoryServices.getAllCategories);
  const { data: nestedData } = useAsync(CategoryServices.getShowingCategory);

  const { showingTranslateValue } = useUtilsFunction();

  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && data) {
      console.log("ChildCategory - Full data:", data);
      console.log("ChildCategory - Looking for ID:", id);
      console.log("ChildCategory - Data length:", data.length);
      
      if (data.length > 0) {
        // Find the target category
        const targetCategory = data.find(cat => cat._id === id);
        console.log("ChildCategory - Target category:", targetCategory);
        
        if (targetCategory) {
          // Find all subcategories that have this category as parent
          const subcategories = data.filter(cat => cat.parentId === id);
          console.log("ChildCategory - Found subcategories:", subcategories);
          
          // Build breadcrumb path
          const buildAncestors = (categoryId) => {
            const ancestors = [];
            let currentId = categoryId;
            
            while (currentId) {
              const category = data.find(cat => cat._id === currentId);
              if (category) {
                ancestors.unshift(category);
                currentId = category.parentId;
              } else {
                break;
              }
            }
            
            return ancestors;
          };
          
          const ancestors = buildAncestors(id);
          console.log("ChildCategory - Ancestors:", ancestors);
          
          setChildCategory(subcategories);
          setSelectObj(ancestors);
        } else {
          console.log("ChildCategory - Target category not found");
        }
      } else {
        console.log("ChildCategory - No data available");
      }
    }
  }, [id, loading, data]);

  const {
    totalResults,
    resultsPerPage,
    dataTable,
    serviceData,
    handleChangePage,
  } = useFilter(childCategory);

  const handleSelectAll = () => {
    setIsCheckAll(!isCheckAll);
    setIsCheck(childCategory?.map((li) => li._id));
    if (isCheckAll) {
      setIsCheck([]);
    }
  };

  return (
    <>
      <PageTitle>{t("CategoryPageTitle")}</PageTitle>

      <DeleteModal ids={allId} setIsCheck={setIsCheck} category />

      <BulkActionDrawer
        ids={allId}
        title="Child Categories"
        lang={lang}
        data={nestedData}
        childId={id}
      />

      <AnimatedContent>
        <div className="flex items-center pb-4">
          <ol className="flex items-center w-full overflow-hidden font-serif">
            <li className="text-sm pr-1 transition duration-200 ease-in cursor-pointer hover:text-emerald-500 font-semibold">
              <Link to={`/categories`}>{t("Categories")}</Link>
            </li>
            {selectedObj?.map((child, i) => (
              <span key={i + 1} className="flex items-center font-serif">
                <li className="text-sm mt-[1px]">
                  {" "}
                  <FiChevronRight />{" "}
                </li>
                <li className="text-sm pl-1 transition duration-200 ease-in cursor-pointer text-blue-700 hover:text-emerald-500 font-semibold ">
                  <Link to={`/categories/${child._id}`}>
                    {showingTranslateValue(child?.name)}
                  </Link>
                </li>
              </span>
            ))}
          </ol>
        </div>

        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
          <CardBody>
            <div className="flex justify-end items-end">
              <Button onClick={toggleDrawer} className="rounded-md h-12">
                <span className="mr-3">
                  <FiPlus />
                </span>
                {t("AddCategory")}
              </Button>

              <div className="ml-3 w-full md:w-24 lg:w-24 xl:w-24">
                <Button
                  disabled={isCheck.length < 1}
                  onClick={() => handleUpdateMany(isCheck)}
                  className="w-full rounded-md h-12"
                >
                  <FiEdit />
                  {t("BulkAction")}
                </Button>
              </div>

              <Button
                disabled={isCheck.length < 1}
                onClick={() => handleDeleteMany(isCheck)}
                className="ml-3 rounded-md h-12 bg-red-500"
              >
                <span className="mr-3">
                  <FiTrash2 />
                </span>
                {t("Delete")}
              </Button>
            </div>
          </CardBody>
        </Card>
      </AnimatedContent>

      {loading ? (
        <Loading loading={loading} />
      ) : error ? (
        <span className="text-center mx-auto text-red-500">{error}</span>
      ) : serviceData?.length !== 0 ? (
        <TableContainer className="mb-8">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>
                  <CheckBox
                    type="checkbox"
                    name="selectAll"
                    id="selectAll"
                    handleClick={handleSelectAll}
                    isChecked={isCheckAll}
                  />
                </TableCell>
                <TableCell>{t("catIdTbl")}</TableCell>
                <TableCell>{t("catIconTbl")}</TableCell>
                <TableCell>{t("Name")}</TableCell>
                <TableCell>{t("Description")}</TableCell>

                <TableCell className="text-center">
                  {t("catPublishedTbl")}
                </TableCell>
                <TableCell className="text-right">
                  {t("catActionsTbl")}
                </TableCell>
              </tr>
            </TableHeader>

            <CategoryTable
              categories={dataTable}
              data={data}
              lang={lang}
              isCheck={isCheck}
              setIsCheck={setIsCheck}
              useParamId={id}
            />
          </Table>
          <TableFooter>
            <Pagination
              totalResults={totalResults}
              resultsPerPage={resultsPerPage}
              onChange={handleChangePage}
              label="Table navigation"
            />
          </TableFooter>
        </TableContainer>
      ) : (
        <NotFound title="Sorry, There are no categories right now." />
      )}
    </>
  );
};

export default ChildCategory;
