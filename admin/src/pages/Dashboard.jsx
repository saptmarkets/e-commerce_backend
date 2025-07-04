import {
  Pagination,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
  WindmillContext,
} from "@windmill/react-ui";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiCheck, FiRefreshCw, FiShoppingCart, FiTruck } from "react-icons/fi";
import { ImCreditCard, ImStack } from "react-icons/im";

//internal import
import useAsync from "@/hooks/useAsync";
import useFilter from "@/hooks/useFilter";
import LineChart from "@/components/chart/LineChart/LineChart";
import PieChart from "@/components/chart/Pie/PieChart";
import CardItem from "@/components/dashboard/CardItem";
import CardItemTwo from "@/components/dashboard/CardItemTwo";
import ChartCard from "@/components/chart/ChartCard";
import OrderTable from "@/components/order/OrderTable";
import TableLoading from "@/components/preloader/TableLoading";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { SidebarContext } from "@/context/SidebarContext";
import OrderServices from "@/services/OrderServices";
import AnimatedContent from "@/components/common/AnimatedContent";
import ProductUnitServices from '@/services/ProductUnitServices';
import PromotionServices from '@/services/PromotionServices';
import useUtilsFunction from '@/hooks/useUtilsFunction';

const Dashboard = () => {
  const { t } = useTranslation();
  const { mode } = useContext(WindmillContext);

  dayjs.extend(isBetween);
  dayjs.extend(isToday);
  dayjs.extend(isYesterday);

  const { currentPage, handleChangePage } = useContext(SidebarContext);
  const { currency, getNumberTwo } = useUtilsFunction();

  // react hook
  const [todayOrderAmount, setTodayOrderAmount] = useState(0);
  const [yesterdayOrderAmount, setYesterdayOrderAmount] = useState(0);
  const [salesReport, setSalesReport] = useState([]);
  const [todayCashPayment, setTodayCashPayment] = useState(0);
  const [todayCardPayment, setTodayCardPayment] = useState(0);
  const [todayCreditPayment, setTodayCreditPayment] = useState(0);
  const [yesterdayCashPayment, setYesterdayCashPayment] = useState(0);
  const [yesterdayCardPayment, setYesterdayCardPayment] = useState(0);
  const [yesterdayCreditPayment, setYesterdayCreditPayment] = useState(0);

  // New state for low stock and promotions
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [activePromotions, setActivePromotions] = useState([]);

  const {
    data: bestSellerProductChart,
    loading: loadingBestSellerProduct,
    error,
  } = useAsync(OrderServices.getBestSellerProductChart);

  const { data: dashboardRecentOrder, loading: loadingRecentOrder } = useAsync(
    () => OrderServices.getDashboardRecentOrder({ page: currentPage, limit: 8 })
  );

  const { data: dashboardOrderCount, loading: loadingOrderCount } = useAsync(
    OrderServices.getDashboardCount
  );

  const { data: dashboardOrderAmount, loading: loadingOrderAmount } = useAsync(
    OrderServices.getDashboardAmount
  );

  // console.log("dashboardOrderCount", dashboardOrderCount);

  const { dataTable, serviceData } = useFilter(dashboardRecentOrder?.orders);

  useEffect(() => {
    // today orders show
    const todayOrder = dashboardOrderAmount?.ordersData?.filter((order) =>
      dayjs(order.updatedAt).isToday()
    );
    //  console.log('todayOrder',dashboardOrderAmount.ordersData)
    const todayReport = todayOrder?.reduce((pre, acc) => pre + acc.total, 0);
    setTodayOrderAmount(todayReport);

    // yesterday orders
    const yesterdayOrder = dashboardOrderAmount?.ordersData?.filter((order) =>
      dayjs(order.updatedAt).set(-1, "day").isYesterday()
    );

    const yesterdayReport = yesterdayOrder?.reduce(
      (pre, acc) => pre + acc.total,
      0
    );
    setYesterdayOrderAmount(yesterdayReport);

    // sales orders chart data
    const salesOrderChartData = dashboardOrderAmount?.ordersData?.filter(
      (order) =>
        dayjs(order.updatedAt).isBetween(
          new Date().setDate(new Date().getDate() - 7),
          new Date()
        )
    );

    salesOrderChartData?.reduce((res, value) => {
      let onlyDate = value.updatedAt.split("T")[0];

      if (!res[onlyDate]) {
        res[onlyDate] = { date: onlyDate, total: 0, order: 0 };
        salesReport.push(res[onlyDate]);
      }
      res[onlyDate].total += value.total;
      res[onlyDate].order += 1;
      return res;
    }, {});

    setSalesReport(salesReport);

    const todayPaymentMethodData = [];
    const yesterDayPaymentMethodData = [];

    // today order payment method
    dashboardOrderAmount?.ordersData?.filter((item, value) => {
      if (dayjs(item.updatedAt).isToday()) {
        if (item.paymentMethod === "Cash") {
          let cashMethod = {
            paymentMethod: "Cash",
            total: item.total,
          };
          todayPaymentMethodData.push(cashMethod);
        }

        if (item.paymentMethod === "Credit") {
          const cashMethod = {
            paymentMethod: "Credit",
            total: item.total,
          };

          todayPaymentMethodData.push(cashMethod);
        }

        if (item.paymentMethod === "Card") {
          const cashMethod = {
            paymentMethod: "Card",
            total: item.total,
          };

          todayPaymentMethodData.push(cashMethod);
        }
      }

      return item;
    });
    // yesterday order payment method
    dashboardOrderAmount?.ordersData?.filter((item, value) => {
      if (dayjs(item.updatedAt).set(-1, "day").isYesterday()) {
        if (item.paymentMethod === "Cash") {
          let cashMethod = {
            paymentMethod: "Cash",
            total: item.total,
          };
          yesterDayPaymentMethodData.push(cashMethod);
        }

        if (item.paymentMethod === "Credit") {
          const cashMethod = {
            paymentMethod: "Credit",
            total: item?.total,
          };

          yesterDayPaymentMethodData.push(cashMethod);
        }

        if (item.paymentMethod === "Card") {
          const cashMethod = {
            paymentMethod: "Card",
            total: item?.total,
          };

          yesterDayPaymentMethodData.push(cashMethod);
        }
      }

      return item;
    });

    const todayCsCdCit = Object.values(
      todayPaymentMethodData.reduce((r, { paymentMethod, total }) => {
        if (!r[paymentMethod]) {
          r[paymentMethod] = { paymentMethod, total: 0 };
        }
        r[paymentMethod].total += total;

        return r;
      }, {})
    );
    const today_cash_payment = todayCsCdCit.find(
      (el) => el.paymentMethod === "Cash"
    );
    setTodayCashPayment(today_cash_payment?.total);
    const today_card_payment = todayCsCdCit.find(
      (el) => el.paymentMethod === "Card"
    );
    setTodayCardPayment(today_card_payment?.total);
    const today_credit_payment = todayCsCdCit.find(
      (el) => el.paymentMethod === "Credit"
    );
    setTodayCreditPayment(today_credit_payment?.total);

    const yesterDayCsCdCit = Object.values(
      yesterDayPaymentMethodData.reduce((r, { paymentMethod, total }) => {
        if (!r[paymentMethod]) {
          r[paymentMethod] = { paymentMethod, total: 0 };
        }
        r[paymentMethod].total += total;

        return r;
      }, {})
    );
    const yesterday_cash_payment = yesterDayCsCdCit.find(
      (el) => el.paymentMethod === "Cash"
    );
    setYesterdayCashPayment(yesterday_cash_payment?.total);
    const yesterday_card_payment = yesterDayCsCdCit.find(
      (el) => el.paymentMethod === "Card"
    );
    setYesterdayCardPayment(yesterday_card_payment?.total);
    const yesterday_credit_payment = yesterDayCsCdCit.find(
      (el) => el.paymentMethod === "Credit"
    );
    setYesterdayCreditPayment(yesterday_credit_payment?.total);

    // Fetch low stock products and active promotions
    ProductUnitServices.getUnitsRequiringRefill().then(res => {
      setLowStockProducts(res?.data || []);
    }).catch(() => setLowStockProducts([]));
    PromotionServices.getActivePromotions().then(res => {
      setActivePromotions(Array.isArray(res) ? res : (res?.promotions || []));
    }).catch(() => setActivePromotions([]));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardOrderAmount]);

  // --- Modern Sectioned Dashboard Layout ---
  return (
    <>
      <PageTitle>{t("DashboardOverview")}</PageTitle>
      {/* Trisha's Fun Fact: "A clean dashboard is a happy dashboard!" */}
      <AnimatedContent>
        {/* Key Metrics Section */}
        <section className="mb-8 p-6 bg-white rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center justify-center">
            <ImStack className="text-3xl text-teal-600 mb-2" />
            <div className="text-lg font-semibold">Today Orders</div>
            <div className="text-2xl font-bold">{currency}{getNumberTwo(todayOrderAmount || 0)}</div>
            <div className="text-xs text-gray-500">Cash: {currency}{getNumberTwo(todayCashPayment || 0)} | Card: {currency}{getNumberTwo(todayCardPayment || 0)} | Credit: {currency}{getNumberTwo(todayCreditPayment || 0)}</div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <ImStack className="text-3xl text-orange-500 mb-2" />
            <div className="text-lg font-semibold">Yesterday Orders</div>
            <div className="text-2xl font-bold">{currency}{getNumberTwo(yesterdayOrderAmount || 0)}</div>
            <div className="text-xs text-gray-500">Cash: {currency}{getNumberTwo(yesterdayCashPayment || 0)} | Card: {currency}{getNumberTwo(yesterdayCardPayment || 0)} | Credit: {currency}{getNumberTwo(yesterdayCreditPayment || 0)}</div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <FiShoppingCart className="text-3xl text-blue-500 mb-2" />
            <div className="text-lg font-semibold">This Month</div>
            <div className="text-2xl font-bold">{currency}{getNumberTwo(dashboardOrderAmount?.thisMonthlyOrderAmount || 0)}</div>
            <div className="text-xs text-gray-500">All-Time Sales: {currency}{getNumberTwo(dashboardOrderAmount?.totalAmount || 0)}</div>
          </div>
        </section>
        {/* Order Status Section */}
        <section className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FiRefreshCw /> Order Status Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CardItem title="Total Order" Icon={FiShoppingCart} loading={loadingOrderCount} quantity={dashboardOrderCount?.totalOrder || 0} className="text-orange-600 dark:text-orange-100 bg-orange-100 dark:bg-orange-500" />
            <CardItem title={t("OrderPending")} Icon={FiRefreshCw} loading={loadingOrderCount} quantity={dashboardOrderCount?.totalPendingOrder?.count || 0} amount={dashboardOrderCount?.totalPendingOrder?.total || 0} className="text-blue-600 dark:text-blue-100 bg-blue-100 dark:bg-blue-500" />
            <CardItem title={t("OrderProcessing")} Icon={FiTruck} loading={loadingOrderCount} quantity={dashboardOrderCount?.totalProcessingOrder || 0} className="text-teal-600 dark:text-teal-100 bg-teal-100 dark:bg-teal-500" />
            <CardItem title={t("OrderDelivered")} Icon={FiCheck} loading={loadingOrderCount} quantity={dashboardOrderCount?.totalDeliveredOrder || 0} className="text-emerald-600 dark:text-emerald-100 bg-emerald-100 dark:bg-emerald-500" />
          </div>
        </section>
        {/* Sales & Best Sellers Section */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Weekly Sales</h2>
            <ChartCard mode={mode} loading={loadingOrderAmount} title="">
              <LineChart salesReport={salesReport} />
            </ChartCard>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Best Selling Products</h2>
            <ChartCard mode={mode} loading={loadingBestSellerProduct} title="">
              <PieChart data={bestSellerProductChart} />
            </ChartCard>
          </div>
        </section>
        {/* Low Stock Products Section */}
        <section className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Low Stock Alerts</h2>
          {lowStockProducts.length === 0 ? (
            <div className="text-green-600">All products are well stocked! 🎉</div>
          ) : (
            <ul className="space-y-2">
              {lowStockProducts.map((unit, idx) => (
                <li key={unit._id || idx} className="bg-red-50 border-l-4 border-red-400 p-2 rounded flex justify-between items-center">
                  <span>{unit.productName || unit.name} ({unit.sku || unit.barcode})</span>
                  <span className="text-red-700 font-bold">Stock: {unit.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        {/* Active Promotions Section */}
        <section className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Active Promotions</h2>
          {activePromotions.length === 0 ? (
            <div className="text-gray-500">No active promotions at the moment.</div>
          ) : (
            <ul className="space-y-2">
              {activePromotions.map((promo, idx) => (
                <li key={promo._id || idx} className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded flex justify-between items-center">
                  <span>{promo.name || promo.title || 'Promotion'} ({promo.type})</span>
                  <span className="text-blue-700 font-bold">{promo.status || 'Active'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        {/* Recent Orders Section */}
        <section className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          {loadingRecentOrder ? (
            <TableLoading row={5} col={4} />
          ) : error ? (
            <span className="text-center mx-auto text-red-500">{error}</span>
          ) : serviceData?.length !== 0 ? (
            <TableContainer className="mb-8">
              <Table>
                <TableHeader>
                  <tr>
                    <TableCell>{t("InvoiceNo")}</TableCell>
                    <TableCell>{t("TimeTbl")}</TableCell>
                    <TableCell>{t("CustomerName")} </TableCell>
                    <TableCell> {t("MethodTbl")} </TableCell>
                    <TableCell> {t("AmountTbl")} </TableCell>
                    <TableCell>{t("OderStatusTbl")}</TableCell>
                    <TableCell>{t("ActionTbl")}</TableCell>
                    <TableCell className="text-right">{t("InvoiceTbl")}</TableCell>
                  </tr>
                </TableHeader>
                <OrderTable orders={dataTable} />
              </Table>
              <TableFooter>
                <Pagination
                  totalResults={dashboardRecentOrder?.totalOrder}
                  resultsPerPage={8}
                  onChange={handleChangePage}
                  label="Table navigation"
                />
              </TableFooter>
            </TableContainer>
          ) : (
            <NotFound title="Sorry, There are no orders right now." />
          )}
        </section>
      </AnimatedContent>
    </>
  );
};

export default Dashboard;
