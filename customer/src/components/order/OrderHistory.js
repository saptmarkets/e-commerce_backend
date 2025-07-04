import React from "react";
import dayjs from "dayjs";
import useTranslation from "next-translate/useTranslation";

const OrderHistory = ({ order, currency }) => {
  const { t } = useTranslation("common");
  // Map status to translation key
  const statusKey =
    order.status === "Delivered"
      ? "statusDelivered"
      : order.status === "Pending"
      ? "statusReceived"
      : order.status === "Cancel" || order.status === "Cancelled"
      ? "statusCancelled"
      : order.status === "Processing"
      ? "statusProcessing"
      : order.status === "Out for Delivery"
      ? "statusOutForDelivery"
      : order.status;

  return (
    <>
      <td className="px-5 py-3 leading-6 whitespace-nowrap">
        <span className="uppercase text-sm font-medium">#{order?.invoice}</span>
      </td>
      <td className="px-5 py-3 leading-6 text-center whitespace-nowrap">
        <span className="text-sm">
          {dayjs(order.createdAt).format("MMMM D, YYYY")}
        </span>
      </td>

      <td className="px-5 py-3 leading-6 text-center whitespace-nowrap">
        <span className="text-sm">{order.paymentMethod}</span>
      </td>
      <td className="px-5 py-3 leading-6 text-center whitespace-nowrap font-medium text-sm">
        {order.status === "Delivered" && (
          <span className="text-emerald-500">{t(statusKey)}</span>
        )}
        {order.status === "Pending" && (
          <span className="text-orange-500">{t(statusKey)}</span>
        )}
        {(order.status === "Cancel" || order.status === "Cancelled") && (
          <span className="text-red-500">{t(statusKey)}</span>
        )}
        {order.status === "Processing" && (
          <span className="text-indigo-500">{t(statusKey)}</span>
        )}
        {order.status === "Out for Delivery" && (
          <span className="text-blue-500">{t(statusKey)}</span>
        )}
      </td>
      <td className="px-5 py-3 leading-6 text-center whitespace-nowrap">
        <span className="text-sm font-bold">
          {currency}
          {parseFloat(order?.total).toFixed(2)}
        </span>
      </td>
    </>
  );
};

export default OrderHistory;
