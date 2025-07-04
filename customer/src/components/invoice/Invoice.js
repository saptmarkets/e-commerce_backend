import dayjs from "dayjs";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import useTranslation from "next-translate/useTranslation";

//internal import
import OrderTable from "@components/order/OrderTable";
import useUtilsFunction from "@hooks/useUtilsFunction";
import VerificationCodeDisplay from "@components/order/VerificationCodeDisplay";

const Invoice = ({ data, printRef, globalSetting, currency }) => {
  // console.log('invoice data',data)
  const { t } = useTranslation();
  console.log('Invoice data received:', {
    verificationCode: data?.verificationCode,
    status: data?.status,
    invoice: data?.invoice
  });

  const { getNumberTwo } = useUtilsFunction();

  return (
    <div ref={printRef}>
      <div className="bg-indigo-50 p-8 rounded-t-xl">
        <div className="flex lg:flex-row md:flex-row flex-col lg:items-center justify-between pb-4 border-b border-gray-50">
          <div>
            <h1 className="font-bold font-serif text-2xl uppercase">Invoice</h1>
            <h6 className="text-gray-700">
              Status :{" "}
              {data.status === "Delivered" && (
                <span className="text-emerald-500">{t('statusDelivered')}</span>
              )}
              {data.status === "Received" && (
                <span className="text-blue-500">{t('statusReceived')}</span>
              )}
              {data.status === "Processing" && (
                <span className="text-indigo-500">{t('statusProcessing')}</span>
              )}
              {data.status === "Out for Delivery" && (
                <span className="text-purple-500">{t('statusOutForDelivery')}</span>
              )}
              {data.status === "Cancel" && (
                <span className="text-red-500">{t('statusCancelled')}</span>
              )}
              {/* Default case for any other status not explicitly handled */}
              {!(data.status === "Delivered" || data.status === "Received" || data.status === "Processing" || data.status === "Out for Delivery" || data.status === "Cancel") && (
                <span className="text-gray-500">{data.status}</span>
              )}
            </h6>
          </div>
          <div className="lg:text-right text-left">
            <h2 className="lg:flex lg:justify-end text-lg font-serif font-semibold mt-4 lg:mt-0 lg:ml-0 md:mt-0">
              <Image
                width={110}
                height={40}
                src={
                  globalSetting?.logo ||
                  "/logo/logo-color.png"
                }
                alt="logo"
              />
            </h2>
          </div>
        </div>
        <div className="flex lg:flex-row md:flex-row flex-col justify-between pt-4">
          <div className="mb-3 md:mb-0 lg:mb-0 flex flex-col">
            <span className="font-bold font-serif text-sm uppercase text-gray-600 block">
              Date
            </span>
            <span className="text-sm text-gray-500 block">
              {data.createdAt !== undefined ? (
                <span>{dayjs(data.createdAt).format("MMMM D, YYYY")}</span>
              ) : (
                <span>{dayjs().format("MMMM D, YYYY")}</span>
              )}
            </span>
          </div>
          <div className="mb-3 md:mb-0 lg:mb-0 flex flex-col">
            <span className="font-bold font-serif text-sm uppercase text-gray-600 block">
              Invoice No.
            </span>
            <span className="text-sm text-gray-500 block">#{data.invoice}</span>
          </div>
          <div className="flex flex-col lg:text-right text-left">
            <span className="font-bold font-serif text-sm uppercase text-gray-600 block">
              Invoice To.
            </span>
            <span className="text-sm text-gray-500 block">
              {data?.user_info?.name} <br />
              {data?.user_info?.email}{" "}
              <span className="ml-2">{data?.user_info?.contact}</span>
              <br />
              {data?.user_info?.address}
              <br />
              {data?.city} {data?.country} {data?.zipCode}
            </span>
          </div>
        </div>
      </div>

      {/* Verification Code Display - Show for non-delivered orders */}
      {data?.verificationCode && data?.status !== "Delivered" && data?.status !== "Cancel" && (
        <div className="px-8 pt-6">
          <VerificationCodeDisplay 
            verificationCode={data.verificationCode}
            orderInvoice={data.invoice}
            onCopy={() => console.log('Verification code copied')}
          />
        </div>
      )}

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-8 pt-2">
          <div className="bg-gray-100 p-2 rounded text-xs">
            <strong>Debug:</strong> verificationCode: {data?.verificationCode || 'NOT FOUND'}, 
            status: {data?.status}, 
            shouldShow: {(data?.verificationCode && data?.status !== "Delivered" && data?.status !== "Cancel") ? 'YES' : 'NO'}
          </div>
        </div>
      )}

      <div className="s-table-container">
        <table className="s-table">
          <thead>
            <tr className="s-table-row">
              <th className="s-table-head">
                <h4 className="font-semibold text-center uppercase text-xs text-gray-600">
                  SL
                </h4>
              </th>
              <th className="s-table-head">
                <h4 className="font-semibold uppercase text-xs text-gray-600">
                  Product Details
                </h4>
              </th>
              <th className="s-table-head">
                <h4 className="font-semibold text-center uppercase text-xs text-gray-600">
                  Quantity
                </h4>
              </th>
              <th className="s-table-head">
                <h4 className="font-semibold text-center uppercase text-xs text-gray-600">
                  Item Price
                </h4>
              </th>
              <th className="s-table-head">
                <h4 className="font-semibold text-center uppercase text-xs text-gray-600">
                  Amount
                </h4>
              </th>
            </tr>
          </thead>
          <OrderTable data={data} currency={currency} />
        </table>
      </div>

      <div className="flex lg:flex-row md:flex-row flex-col justify-between">
        <div className="mb-3 md:mb-0 lg:mb-0 flex flex-col sm:flex-wrap">
          <span className="mb-1 font-bold font-serif text-sm uppercase text-gray-600 block">
            Payment Method
          </span>
          <span className="text-sm text-gray-500 font-semibold font-serif block">
            {data.paymentMethod}
          </span>
        </div>
        <div className="flex flex-col sm:flex-wrap">
          <table className="table-auto">
            <tbody>
              <tr className="border-b border-gray-100 last:border-b-0 text-sm">
                <td className="px-4 py-1 font-semibold text-gray-500 font-serif uppercase tracking-wide">
                  Sub Total
                </td>
                <td className="px-4 py-1 text-gray-500 font-DejaVu tracking-widest">
                  {currency}
                  {getNumberTwo(data.subTotal)}
                </td>
              </tr>
              <tr className="border-b border-gray-100 last:border-b-0 text-sm">
                <td className="px-4 py-1 font-semibold text-gray-500 font-serif uppercase tracking-wide">
                  Shipping Cost
                </td>
                <td className="px-4 py-1 text-gray-500 font-DejaVu tracking-widest">
                  {currency}
                  {getNumberTwo(data.shippingCost)}
                </td>
              </tr>
              <tr className="border-b border-gray-100 last:border-b-0 text-sm">
                <td className="px-4 py-1 font-semibold text-gray-500 font-serif uppercase tracking-wide">
                  Discount
                </td>
                <td className="px-4 py-1 text-gray-500 font-DejaVu tracking-widest">
                  {currency}
                  {getNumberTwo(data.discount)}
                </td>
              </tr>
              <tr className="border-b-2 border-gray-300 bg-gray-50 text-sm">
                <td className="px-4 py-2 font-bold text-black font-serif uppercase tracking-wide">
                  Total
                </td>
                <td className="px-4 py-2 font-bold text-black font-DejaVu tracking-widest">
                  {currency}
                  {getNumberTwo(data.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
