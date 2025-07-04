import { TableBody, TableCell, TableRow, Badge } from "@windmill/react-ui";
import dayjs from "dayjs";
import { t } from "i18next";
import React from "react";
import { FiZoomIn, FiStar, FiFileText, FiTrendingUp, FiEye } from "react-icons/fi";
import { Link } from "react-router-dom";

//internal import
import MainDrawer from "@/components/drawer/MainDrawer";
import DeleteModal from "@/components/modal/DeleteModal";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import Tooltip from "@/components/tooltip/Tooltip";
import CustomerDrawer from "@/components/drawer/CustomerDrawer";
import EditDeleteButton from "@/components/table/EditDeleteButton";

// internal imports

const CustomerTable = ({ customers }) => {
  const { title, serviceId, handleModalOpen, handleUpdate } = useToggleDrawer();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <>
      <DeleteModal id={serviceId} title={title} />

      <MainDrawer>
        <CustomerDrawer id={serviceId} />
      </MainDrawer>

      <TableBody>
        {customers?.map((user) => (
          <TableRow key={user._id}>
            <TableCell>
              <span className="font-semibold uppercase text-xs">
                {" "}
                {user?._id?.substring(20, 24)}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm">
                {dayjs(user.createdAt).format("MMM D, YYYY")}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                {user.loyaltyPoints && (
                  <div className="flex items-center space-x-1 mt-1">
                    <FiStar className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-purple-600 font-semibold">
                      {user.loyaltyPoints.current || 0} points
                    </span>
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm">{user.email}</span>{" "}
            </TableCell>
            <TableCell>
              <span className="text-sm font-medium">{user.phone}</span>
            </TableCell>
            
            {/* Purchase Stats */}
            <TableCell>
              <div className="flex flex-col space-y-1">
                {user.purchaseStats ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Orders:</span>
                      <span className="text-xs font-semibold text-blue-600">
                        {user.purchaseStats.totalOrders || 0}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Spent:</span>
                      <span className="text-xs font-semibold text-green-600">
                        {formatCurrency(user.purchaseStats.totalSpent)} SAR
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">No purchases yet</span>
                )}
              </div>
            </TableCell>

            {/* Loyalty Status */}
            <TableCell>
              <div className="flex flex-col space-y-1">
                {user.loyaltyPoints ? (
                  <>
                    <Badge 
                      type={user.loyaltyPoints.current > 100 ? "success" : 
                            user.loyaltyPoints.current > 50 ? "warning" : "neutral"}
                    >
                      {user.loyaltyPoints.current > 100 ? "VIP" : 
                       user.loyaltyPoints.current > 50 ? "Active" : "New"}
                    </Badge>
                    <span className="text-xs text-gray-600">
                      Total: {user.loyaltyPoints.total || 0}
                    </span>
                  </>
                ) : (
                  <Badge type="neutral">New</Badge>
                )}
              </div>
            </TableCell>

            <TableCell>
              <div className="flex justify-end text-right space-x-2">
                {/* View Orders */}
                <div className="p-2 cursor-pointer text-gray-400 hover:text-blue-600">
                  <Link to={`/customer-order/${user._id}`}>
                    <Tooltip
                      id="orders"
                      Icon={FiZoomIn}
                      title="View Orders"
                      bgColor="#3B82F6"
                    />
                  </Link>
                </div>

                {/* View Loyalty Details */}
                <div className="p-2 cursor-pointer text-gray-400 hover:text-purple-600">
                  <Link to={`/customer-loyalty/${user._id}`}>
                    <Tooltip
                      id="loyalty"
                      Icon={FiStar}
                      title="Loyalty Details"
                      bgColor="#8B5CF6"
                    />
                  </Link>
                </div>

                {/* View Customer Profile */}
                <div className="p-2 cursor-pointer text-gray-400 hover:text-emerald-600">
                  <Link to={`/customer-details/${user._id}`}>
                    <Tooltip
                      id="profile"
                      Icon={FiEye}
                      title="Customer Profile"
                      bgColor="#10B981"
                    />
                  </Link>
                </div>

                <EditDeleteButton
                  title={user.name}
                  id={user._id}
                  handleUpdate={handleUpdate}
                  handleModalOpen={handleModalOpen}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </>
  );
};

export default CustomerTable;
