import { Badge } from "@windmill/react-ui";
import { useTranslation } from "react-i18next";

const Status = ({ status }) => {
  const { t } = useTranslation();

  const getStatusText = (status) => {
    switch (status) {
      case "Delivered":
        return t("Delivered");
      case "Processing":
        return t("Processing");
      case "Pending":
        return t("Pending");
      case "Received":
        return t("Received");
      case "Out for Delivery":
        return t("OutForDelivery");
      case "Cancelled":
        return t("Cancelled");
      case "Cancel":
        return t("Cancelled");
      case "Active":
        return t("Active");
      case "Inactive":
        return t("Inactive");
      case "Waiting for Password Reset":
        return t("WaitingForPasswordReset");
      default:
        return status;
    }
  };
  return (
    <>
      <span className="font-serif">
        {(status === "Pending" || status === "Inactive") && (
          <Badge type="warning">{getStatusText(status)}</Badge>
        )}
        {status === "Waiting for Password Reset" && (
          <Badge type="warning">{getStatusText(status)}</Badge>
        )}
        {status === "Processing" && <Badge>{getStatusText(status)}</Badge>}
        {(status === "Delivered" || status === "Active") && (
          <Badge type="success">{getStatusText(status)}</Badge>
        )}
        {status === "Cancel" && <Badge type="danger">{getStatusText(status)}</Badge>}
        {status === `POS-Completed` && (
          <Badge className="dark:bg-teal-900 bg-teal-100">{getStatusText(status)}</Badge>
        )}
      </span>
    </>
  );
};

export default Status;
