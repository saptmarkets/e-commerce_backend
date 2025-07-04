import React, { useContext, useState } from "react";
import { Select } from "@windmill/react-ui";

//internal import
import OrderServices from "@/services/OrderServices";
import { notifySuccess, notifyError } from "@/utils/toast";
import { SidebarContext } from "@/context/SidebarContext";
import { AdminContext } from "@/context/AdminContext";
import httpService from "@/services/httpService";

const SelectStatus = ({ id, order }) => {
  // console.log('id',id ,'order',order)
  const { setIsUpdate } = useContext(SidebarContext);
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChangeStatus = async (id, status) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      console.log(`Attempting to change order ${id} status from ${order?.status} to ${status}`);
      
      // Validate status transitions
      if (!isValidStatusTransition(order?.status, status)) {
        notifyError(`Invalid status transition from ${order?.status} to ${status}. Please follow the proper workflow.`);
        return;
      }
      
      // If status is being changed to "Cancel", use the proper cancel endpoint
      if (status === "Cancel") {
        await OrderServices.cancelOrder(id, "Order cancelled by admin", "admin");
        notifySuccess("Order cancelled successfully! Loyalty points and stock have been restored.");
        setIsUpdate(true);
        return;
      }

      // If changing to Processing, use the delivery system to initialize checklist
      if (status === "Processing" && order?.status === "Pending") {
        try {
          console.log("Using delivery system for Processing status");
          
          // Use httpService for consistent API calls
          const response = await httpService.post(`/delivery/order/${id}/start-processing`, { 
            driverId: null // Can be assigned later
          });

          console.log("Delivery system response:", response);
          notifySuccess("Order moved to Processing! Product checklist created for delivery team.");
          setIsUpdate(true);
          return;
          
        } catch (deliveryError) {
          console.warn("Delivery system error, using regular update:", deliveryError.message);
          // Fall through to regular update
        }
      }

      // If changing to "Out for Delivery", use delivery system
      if (status === "Out for Delivery" && order?.status === "Processing") {
        try {
          console.log("Using delivery system for Out for Delivery status");
          
          const response = await httpService.post(`/delivery/order/${id}/out-for-delivery`);
          
          console.log("Out for delivery response:", response);
          notifySuccess("Order marked as Out for Delivery!");
          setIsUpdate(true);
          return;
          
        } catch (deliveryError) {
          console.warn("Delivery system error for out-for-delivery:", deliveryError.message);
          notifyError(deliveryError.message || "Cannot mark as out for delivery. Please ensure all products are collected first.");
          return;
        }
      }

      // If changing to "Delivered", require verification code
      if (status === "Delivered") {
        // Check if order is in the correct status for delivery completion
        if (order?.status !== "Out for Delivery") {
          notifyError(`Cannot mark as delivered. Order must be "Out for Delivery" first. Current status: ${order?.status}`);
          return;
        }

        const verificationCode = prompt("Enter customer verification code to complete delivery:");
        
        if (!verificationCode) {
          notifyError("Verification code is required to mark order as delivered");
          return;
        }

        try {
          console.log("Using delivery system for Delivered status with verification code");
          
          const response = await httpService.post(`/delivery/order/${id}/complete`, {
            verificationCode: verificationCode.trim()
          });
          
          console.log("Delivery completion response:", response);
          notifySuccess("Order delivered successfully! Customer verified.");
          setIsUpdate(true);
          return;
          
        } catch (deliveryError) {
          console.warn("Delivery completion error:", deliveryError.message);
          notifyError(deliveryError.message || "Invalid verification code or delivery completion failed");
          return;
        }
      }

      // For other status changes or fallback, use the regular update endpoint
      console.log("Using regular order update for status:", status);
      const response = await OrderServices.updateOrder(id, { status: status });
      notifySuccess(response.message || "Order status updated successfully");
      setIsUpdate(true);
      
    } catch (err) {
      console.error("Error updating order status:", err);
      notifyError(err.message || "Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  // Validate status transitions
  const isValidStatusTransition = (currentStatus, newStatus) => {
    const validTransitions = {
      'Pending': ['Processing', 'Cancel'],
      'Processing': ['Out for Delivery', 'Cancel'],
      'Out for Delivery': ['Delivered', 'Cancel'],
      'Delivered': ['Cancel'], // Only allow cancel for delivered orders
      'Cancel': [] // Cannot change from cancelled
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  };

  // Get available status options based on current status
  const getAvailableStatuses = (currentStatus) => {
    const allStatuses = [
      { value: "Pending", label: "Pending" },
      { value: "Processing", label: "Processing" },
      { value: "Out for Delivery", label: "Out for Delivery" },
      { value: "Delivered", label: "Delivered" },
      { value: "Cancel", label: "Cancel" }
    ];

    const validTransitions = {
      'Pending': ['Processing', 'Cancel'],
      'Processing': ['Out for Delivery', 'Cancel'],
      'Out for Delivery': ['Delivered', 'Cancel'],
      'Delivered': [], // Cannot change from delivered
      'Cancel': [] // Cannot change from cancelled
    };

    const availableTransitions = validTransitions[currentStatus] || [];
    return allStatuses.filter(status => 
      status.value === currentStatus || availableTransitions.includes(status.value)
    );
  };

  const availableStatuses = getAvailableStatuses(order?.status);

  return (
    <>
      <Select
        onChange={(e) => handleChangeStatus(id, e.target.value)}
        className="h-8"
        disabled={isUpdating}
      >
        <option value="status" defaultValue hidden>
          {isUpdating ? "Updating..." : order?.status}
        </option>
        {availableStatuses.map(status => (
          <option 
            key={status.value}
            value={status.value}
            defaultValue={order?.status === status.value}
          >
            {status.label}
          </option>
        ))}
      </Select>
    </>
  );
};

export default SelectStatus;
