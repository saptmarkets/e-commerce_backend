import { useContext, useEffect } from "react";
import Link from "next/link";
import { IoBagHandle } from "react-icons/io5";
import ReactPaginate from "react-paginate";
import { useQuery } from "@tanstack/react-query";
import useTranslation from "next-translate/useTranslation";

//internal import
import Dashboard from "./dashboard";
import useGetSetting from "@hooks/useGetSetting";
import OrderServices from "@services/OrderServices";
import Loading from "@components/preloader/Loading";
import useUtilsFunction from "@hooks/useUtilsFunction";
import OrderHistory from "@components/order/OrderHistory";
import { SidebarContext } from "@context/SidebarContext";
import CMSkeletonTwo from "@components/preloader/CMSkeletonTwo";

const MyOrders = () => {
  const { t } = useTranslation('common');
  const { currentPage, handleChangePage, isLoading, setIsLoading } =
    useContext(SidebarContext);

  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();

  const {
    data,
    error,
    isLoading: loading,
  } = useQuery({
    queryKey: ["orders", { currentPage }],
    queryFn: async () =>
      await OrderServices.getOrderCustomer({
        limit: 10,
        page: currentPage,
      }),
    // Poll every 45 seconds if there are non-delivered orders (reduced frequency)
    refetchInterval: (latestData) => {
      if (!latestData) return 45000;
      const hasPending = latestData.orders?.some(
        (o) => !["Delivered", "Cancel", "Cancelled"].includes(o.status)
      );
      return hasPending ? 45000 : false;
    },
  });

  const pageCount = Math.ceil(data?.totalDoc / 8);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // console.log("data?.orders?.length", data?.totalDoc);
  return (
    <>
      {isLoading ? (
        <Loading loading={isLoading} />
      ) : (
        <Dashboard
          title={t('myOrders')}
          description={t('myOrders')}
        >
          <div className="overflow-hidden rounded-md font-serif">
            <div className="flex flex-col">
              <h2 className="text-xl font-serif font-semibold mb-5">
                {t('myOrders')}
              </h2>
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="align-middle inline-block border border-gray-100 rounded-md min-w-full pb-2 sm:px-6 lg:px-8">
                  <div className="overflow-hidden border-b last:border-b-0 border-gray-100 rounded-md">
                    {loading ? (
                      <CMSkeletonTwo
                        count={20}
                        width={100}
                        error={error}
                        loading={loading}
                      />
                    ) : data?.orders?.length === 0 ? (
                      <div className="text-center">
                        <span className="flex justify-center my-30 pt-16 text-emerald-500 font-semibold text-6xl">
                          <IoBagHandle />
                        </span>
                        <h2 className="font-medium text-md my-4 text-gray-600">
                          {t('noOrders')}
                        </h2>
                      </div>
                    ) : (
                      <table className="table-auto min-w-full border border-gray-100 divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr className="bg-gray-100">
                            <th
                              scope="col"
                              className="text-left text-xs font-serif font-semibold px-6 py-2 text-gray-700 uppercase tracking-wider"
                            >
                              {t('orderNumber')}
                            </th>
                            <th
                              scope="col"
                              className="text-center text-xs font-serif font-semibold px-6 py-2 text-gray-700 uppercase tracking-wider"
                            >
                              {t('orderDate')}
                            </th>

                            <th
                              scope="col"
                              className="text-center text-xs font-serif font-semibold px-6 py-2 text-gray-700 uppercase tracking-wider"
                            >
                              {t('paymentMethod')}
                            </th>
                            <th
                              scope="col"
                              className="text-center text-xs font-serif font-semibold px-6 py-2 text-gray-700 uppercase tracking-wider"
                            >
                              {t('orderStatus')}
                            </th>
                            <th
                              scope="col"
                              className="text-center text-xs font-serif font-semibold px-6 py-2 text-gray-700 uppercase tracking-wider"
                            >
                              {t('total')}
                            </th>
                            <th
                              scope="col"
                              className="text-right text-xs font-serif font-semibold px-6 py-2 text-gray-700 uppercase tracking-wider"
                            >
                              {t('action')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {data?.orders?.map((order) => (
                            <tr key={order._id}>
                              <OrderHistory order={order} />
                              <td className="px-5 py-3 whitespace-nowrap text-right text-sm">
                                <Link
                                  className="px-3 py-1 bg-emerald-100 text-xs text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all font-semibold rounded-full"
                                  href={`/order/${order.invoice}`}
                                >
                                  {t('orderDetails')}
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {data?.totalDoc > 10 && (
                      <div className="paginationOrder">
                        <ReactPaginate
                          breakLabel="..."
                          nextLabel={t('next')}
                          onPageChange={(e) => handleChangePage(e.selected + 1)}
                          pageRangeDisplayed={3}
                          pageCount={pageCount}
                          previousLabel={t('previous')}
                          renderOnZeroPageCount={null}
                          pageClassName="page--item"
                          pageLinkClassName="page--link"
                          previousClassName="page-item"
                          previousLinkClassName="page-previous-link"
                          nextClassName="page-item"
                          nextLinkClassName="page-next-link"
                          breakClassName="page--item"
                          breakLinkClassName="page--link"
                          containerClassName="pagination"
                          activeClassName="activePagination"
                          forcePage={currentPage - 1} // Sync UI with currentPage
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dashboard>
      )}
    </>
  );
};

export default MyOrders;
