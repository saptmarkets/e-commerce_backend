import { PDFDownloadLink } from "@react-pdf/renderer";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { IoCloudDownloadOutline, IoPrintOutline } from "react-icons/io5";
import ReactToPrint from "react-to-print";
import { useQuery } from "@tanstack/react-query";

//internal import

import Layout from "@layout/Layout";
import useGetSetting from "@hooks/useGetSetting";
import Invoice from "@components/invoice/Invoice";
import Loading from "@components/preloader/Loading";
import OrderServices from "@services/OrderServices";
import useUtilsFunction from "@hooks/useUtilsFunction";
import InvoiceForDownload from "@components/invoice/InvoiceForDownload";
import CancelOrderButton from "@components/order/CancelOrderButton";

const Order = ({ params }) => {
  const printRef = useRef();
  const orderInvoice = params.invoice;

  const {
    data,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["order", orderInvoice],
    queryFn: async () => await OrderServices.getOrderByInvoice(orderInvoice),
    enabled: !!orderInvoice,
    refetchInterval: (latestData) => {
      // Poll every 30s only if order is not delivered or cancelled (reduced frequency)
      if (!latestData) return 30000;
      return ["Delivered", "Cancel", "Cancelled"].includes(latestData.status) ? false : 30000;
    },
  });

  const { showingTranslateValue, getNumberTwo, currency, lang } = useUtilsFunction();
  const { storeCustomizationSetting, globalSetting } = useGetSetting();

  if (isLoading) {
    return (
      <Layout title="Order Details" description="Order details page">
        <div className="max-w-screen-2xl mx-auto">
          <Loading loading={isLoading} />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Order Details" description="Order details page">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex justify-center items-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Order Not Found
              </h2>
              <p className="text-gray-600">
                The order you're looking for doesn't exist or you don't have permission to view it.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Invoice" description="order confirmation page">
      <div className="max-w-screen-2xl mx-auto py-10 px-3 sm:px-10">
        <div className="bg-white rounded-lg shadow-sm">
          <Invoice
            data={data}
            printRef={printRef}
            currency={currency}
            globalSetting={globalSetting}
          />
          <div className="bg-white p-8 rounded-b-xl">
            <div className="flex lg:flex-row md:flex-row sm:flex-row flex-col justify-between invoice-btn">
              <PDFDownloadLink
                document={
                  <InvoiceForDownload
                    data={data}
                    currency={currency}
                    globalSetting={globalSetting}
                    getNumberTwo={getNumberTwo}
                    showingTranslateValue={showingTranslateValue}
                    lang={lang}
                  />
                }
                fileName={lang === 'ar' ? 'فاتورة.pdf' : 'Invoice.pdf'}
                className="mb-3 sm:mb-0 md:mb-0 lg:mb-0 flex items-center justify-center bg-emerald-500  text-white transition-all font-serif text-sm font-semibold h-10 py-2 px-5 rounded-md"
              >
                {({ loading }) =>
                  loading ? (
                    'Loading...'
                  ) : (
                    <span className="flex items-center">
                      {showingTranslateValue(storeCustomizationSetting?.dashboard?.download_button)}
                      <span className="ml-2 text-base">
                        <IoCloudDownloadOutline />
                      </span>
                    </span>
                  )
                }
              </PDFDownloadLink>

              <ReactToPrint
                trigger={() => (
                  <button className="mb-3 sm:mb-0 md:mb-0 lg:mb-0 flex items-center justify-center bg-emerald-500  text-white transition-all font-serif text-sm font-semibold h-10 py-2 px-5 rounded-md">
                    {showingTranslateValue(
                      storeCustomizationSetting?.dashboard?.print_button
                    )}{" "}
                    <span className="ml-2 text-base">
                      <IoPrintOutline />
                    </span>
                  </button>
                )}
                content={() => printRef.current}
                documentTitle={data?.invoice}
              />

              {/* Cancel Order Button - only show if order can be cancelled */}
              <CancelOrderButton order={data} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps = ({ params }) => {
  return {
    props: { params },
  };
};

export default dynamic(() => Promise.resolve(Order), { ssr: false }); 