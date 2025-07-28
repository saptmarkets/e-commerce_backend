import Cookies from "js-cookie";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useCart } from "react-use-cart";
import useRazorpay from "react-razorpay";
import { useQuery } from "@tanstack/react-query";

//internal import
import { getUserSession } from "@lib/auth";
import { UserContext } from "@context/UserContext";
import OrderServices from "@services/OrderServices";
import useUtilsFunction from "./useUtilsFunction";
import CouponServices from "@services/CouponServices";
import { notifyError, notifySuccess } from "@utils/toast";
import CustomerServices from "@services/CustomerServices";
import NotificationServices from "@services/NotificationServices";
import useTranslation from "next-translate/useTranslation";

const useCheckoutSubmit = (storeSetting, loyaltySummary) => {
  const { t } = useTranslation("common");
  const { dispatch } = useContext(UserContext);

  const [error, setError] = useState("");
  const [total, setTotal] = useState("");
  const [couponInfo, setCouponInfo] = useState({});
  const [minimumAmount, setMinimumAmount] = useState(0);
  const [showCard, setShowCard] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isCheckoutSubmit, setIsCheckoutSubmit] = useState(false);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [useExistingAddress, setUseExistingAddress] = useState(false);
  const [isCouponAvailable, setIsCouponAvailable] = useState(false);
  
  // Loyalty points state
  const [loyaltyDiscountAmount, setLoyaltyDiscountAmount] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const router = useRouter();
  const couponRef = useRef("");
  const [Razorpay] = useRazorpay();
  const { isEmpty, emptyCart, items, cartTotal } = useCart();

  // Get user info safely
  const userInfo = getUserSession() || {};
  const { showDateFormat, currency, globalSetting } = useUtilsFunction();

  const { data, isLoading } = useQuery({
    queryKey: ["shippingAddress", { id: userInfo?.id }],
    queryFn: async () => {
      if (!userInfo?.id) return { shippingAddress: null };
      return await CustomerServices.getShippingAddress({
        userId: userInfo.id,
      });
    },
    select: (data) => data?.shippingAddress,
    enabled: !!userInfo?.id,
  });

  const hasShippingAddress =
    !isLoading && data && Object.keys(data)?.length > 0;

  // console.log("storeSetting", storeSetting);

  // console.log("res", data);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (Cookies.get("couponInfo")) {
      const coupon = JSON.parse(Cookies.get("couponInfo"));
      setCouponInfo(coupon);
      setDiscountPercentage(coupon.discountType);
      setMinimumAmount(coupon.minimumAmount);
    }
    
    // Set default values for the form
    if (userInfo?.email) {
      setValue("email", userInfo.email);
    }
    
    // If shipping address exists and useExistingAddress is enabled, fill in the form
    if (hasShippingAddress && useExistingAddress && data) {
      const nameParts = data?.name?.split(" ") || []; 
      const firstName = nameParts[0] || ""; 
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
      
      setValue("firstName", firstName);
      setValue("lastName", lastName);
      setValue("address", data.address || "");
      setValue("contact", data.contact || "");
      setValue("email", userInfo?.email || data.email || "");
      setValue("city", data.city || "");
      setValue("country", data.country || "");
      setValue("zipCode", data.zipCode || "");
    }
  }, [userInfo, isCouponApplied, hasShippingAddress, useExistingAddress, data]);

  //remove coupon if total value less then minimum amount of coupon
  useEffect(() => {
    if (minimumAmount - discountAmount > total || isEmpty) {
      setDiscountPercentage(0);
      Cookies.remove("couponInfo");
    }
  }, [minimumAmount, total]);

  // Handle loyalty points redemption
  const handleLoyaltyPointsRedemption = (points, discount) => {
    setPointsToRedeem(points);
    setLoyaltyDiscountAmount(discount);
  };

  //calculate total and discount value
  useEffect(() => {
    const discountProductTotal = items?.reduce(
      (preValue, currentValue) => preValue + currentValue.itemTotal,
      0
    );

    let totalValue = 0;
    const subTotal = parseFloat(cartTotal + Number(shippingCost)).toFixed(2);
    const discountAmount =
      discountPercentage?.type === "fixed"
        ? discountPercentage?.value
        : discountProductTotal * (discountPercentage?.value / 100);

    const discountAmountTotal = discountAmount ? discountAmount : 0;

    totalValue = Number(subTotal) - discountAmountTotal - loyaltyDiscountAmount;

    setDiscountAmount(discountAmountTotal);

    // console.log("total", totalValue);

    setTotal(Math.max(0, totalValue));
  }, [cartTotal, shippingCost, discountPercentage, loyaltyDiscountAmount]);

  const submitHandler = async (data) => {
    try {
      setIsCheckoutSubmit(true);
      setError("");

      // Validate email
      if (!data.email) {
        notifyError("Email address is required!");
        setIsCheckoutSubmit(false);
        return;
      }

      // Check if user is logged in
      if (!userInfo?.id) {
        notifyError("Please log in to complete your order");
        setIsCheckoutSubmit(false);
        router.push("/auth/login?redirectUrl=checkout");
        return;
      }

      // Fetch latest customer profile data to ensure we have current information
      let latestCustomerData;
      try {
        latestCustomerData = await CustomerServices.getCustomer(userInfo.id);
      } catch (error) {
        console.warn("Could not fetch latest customer data, using form data:", error);
        latestCustomerData = null;
      }

      const userDetails = {
        name: `${data.firstName} ${data.lastName || ''}`.trim(),
        // Use latest customer phone if available, otherwise use form data or userInfo phone
        contact: latestCustomerData?.phone || data.contact || userInfo?.phone || '', 
        email: data.email || '', // Optional email
        // Use latest customer address if available and form address is empty/default, otherwise use form address
        address: data.address || latestCustomerData?.address || '',
        country: data.country || latestCustomerData?.country || "Saudi Arabia", // Default to Saudi Arabia
        city: data.city || latestCustomerData?.city || '',
        zipCode: data.zipCode || '', // Optional zip code
        // Add location data for delivery
        coordinates: window.userLocationCoords || latestCustomerData?.shippingAddress?.coordinates || null,
        deliveryLocation: {
          latitude: window.userLocationCoords?.latitude || latestCustomerData?.shippingAddress?.deliveryLocation?.latitude || null,
          longitude: window.userLocationCoords?.longitude || latestCustomerData?.shippingAddress?.deliveryLocation?.longitude || null,
          googleMapsLink: window.userLocationCoords?.googleMapsLink || latestCustomerData?.shippingAddress?.deliveryLocation?.googleMapsLink || null,
          googleMapsAddressLink: window.userLocationCoords?.googleMapsAddressLink || latestCustomerData?.shippingAddress?.deliveryLocation?.googleMapsAddressLink || null,
          accuracy: window.userLocationCoords?.accuracy || latestCustomerData?.shippingAddress?.deliveryLocation?.accuracy || null,
        },
      };

      // Order user details processed

      // Process cart items to ensure complete multi-unit information
      const processedCartItems = items.map(item => {
        // Extract product ID from composite ID if needed
        const actualProductId = item.productId || item.id.split('-')[0];
        
        // Enhanced multi-unit processing
        const packQty = item.packQty || 1;
        const unitPrice = item.unitPrice || item.price || 0;
        const basePrice = item.baseProductPrice || item.basePrice || item.price || 0;
        const totalBaseUnits = item.quantity * packQty;
        
        // Processing cart item for checkout
        
        return {
          id: actualProductId,
          productId: actualProductId,
          title: item.title,
          price: unitPrice,
          quantity: item.quantity,
          image: item.image,
          category: item.category,
          sku: item.sku || '',
          
          // Enhanced Multi-unit information for proper inventory management
          selectedUnitId: item.selectedUnitId,
          unitName: item.unitName || 'Unit',
          unitValue: item.unitValue || 1,
          packQty: packQty,
          unitPrice: unitPrice,
          basePrice: basePrice,
          baseProductPrice: basePrice,
          unitType: item.unitType || 'multi',
          totalBaseUnits: totalBaseUnits,
          pricePerBaseUnit: packQty > 0 ? unitPrice / packQty : unitPrice,
          
          // Promotional information
          isCombo: item.isCombo || false,
          promotion: item.promotion || null,
          comboDetails: item.comboDetails || null,
          promotionPrice: item.promotionPrice || null,
          minQty: item.minQty || 1,
          maxQty: item.maxQty || null,
          isPromotional: item.isPromotional || false,
          savings: item.savings || 0,
          
          // Additional metadata for backend processing
          isMultiUnit: item.isMultiUnit || Boolean(item.selectedUnitId),
          originalPrice: item.originalPrice || basePrice,
          barcode: item.barcode || '',
          
          // Stock validation metadata
          availableStock: item.stock || 0,
          stockValidated: true
        };
      });

      // Cart items processed for submission

      let orderInfo = {
        shippingOption: data.shippingOption,
        user_info: userDetails,
        paymentMethod: "COD",
        status: "Pending",
        cart: processedCartItems,
        subTotal: cartTotal,
        shippingCost: shippingCost,
        discount: discountAmount,
        loyaltyDiscount: loyaltyDiscountAmount,
        loyaltyPointsUsed: pointsToRedeem,
        total: Math.max(0, total - loyaltyDiscountAmount),
      };

      // Save shipping address
      await CustomerServices.addShippingAddress({
        userId: userInfo.id,
        shippingAddressData: {
          ...userDetails,
        },
      });

      // Process Cash on Delivery payment
      await handleCashPayment(orderInfo);
      
    } catch (error) {
      notifyError(error?.response?.data?.message || error?.message);
      setIsCheckoutSubmit(false);
    }
  };

  // console.log("globalSetting", globalSetting?.email_to_customer);

  const handleOrderSuccess = async (orderResponse, orderInfo) => {
    try {
      const notificationInfo = {
        orderId: orderResponse?._id,
        message: `${
          orderResponse?.user_info?.name
        } placed an order of ${parseFloat(orderResponse?.total).toFixed(2)}!`,
        image: "",
      };

      const updatedData = {
        ...orderResponse,
        date: showDateFormat(orderResponse.createdAt),
        company_info: {
          currency: currency,
          vat_number: globalSetting?.vat_number,
          company: globalSetting?.company_name,
          address: globalSetting?.address,
          phone: globalSetting?.contact,
          email: globalSetting?.email,
          website: globalSetting?.website,
          from_email: globalSetting?.from_email,
        },
      };

      if (globalSetting?.email_to_customer) {
        // Trigger email in the background
        OrderServices.sendEmailInvoiceToCustomer(updatedData).catch(
          (emailErr) => {
            console.error("Failed to send email invoice:", emailErr.message);
          }
        );
      }

      // Notification will be created server-side; skip client call to avoid auth issues

      // Proceed with order success
      router.push(`/order/${orderResponse?.invoice}`);
      
      // Show success message with verification code if available
      const successMessage = orderResponse?.verificationCode 
        ? t("common:orderConfirmedSuccess", { verificationCode: orderResponse.verificationCode })
        : t("common:orderConfirmedSuccessNoCode");
      
      notifySuccess(successMessage);
      Cookies.remove("couponInfo");
      emptyCart();
      setIsCheckoutSubmit(false);
    } catch (err) {
      console.error("Order success handling error:", err.message);
      throw new Error(err.message);
    }
  };

  //handle cash payment
  const handleCashPayment = async (orderInfo) => {
    try {
      const orderResponse = await OrderServices.addOrder(orderInfo);
      await handleOrderSuccess(orderResponse, orderInfo);
    } catch (err) {
      console.error("Cash payment error:", err.message);
      throw new Error(err.message);
    }
  };

  //handle razorpay payment
  const handlePaymentWithRazorpay = async (orderInfo) => {
    try {
      const { amount, id, currency } =
        await OrderServices.createOrderByRazorPay({
          amount: Math.round(orderInfo.total).toString(),
        });

      const options = {
        key: storeSetting?.razorpay_id,
        amount,
        currency,
        name: "SAPT Markets",
        description: "This is the total cost of your purchase",
        order_id: id,
        handler: async (response) => {
          const razorpayDetails = {
            amount: orderInfo.total,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          };

          const orderData = { ...orderInfo, razorpay: razorpayDetails, car };
          const orderResponse = await OrderServices.addRazorpayOrder(orderData);
          await handleOrderSuccess(orderResponse, orderInfo);
        },
        prefill: {
          name: orderInfo?.user_info?.name || "Customer",
          email: orderInfo?.user_info?.email || "customer@example.com",
          contact: orderInfo?.user_info?.contact || "0000000000",
        },
        theme: { color: "#10b981" },
      };

      const rzpay = new Razorpay(options);
      rzpay.open();
    } catch (err) {
      console.error("Razorpay payment error:", err.message);
      throw new Error(err.message);
    }
  };

  const handleShippingCost = (value) => {
    // console.log("handleShippingCost", value);
    setShippingCost(Number(value));
  };

  //handle default shipping address
  const handleDefaultShippingAddress = (value) => {
    setUseExistingAddress(value);
    if (value && data) {
      const address = data;
      const nameParts = address?.name?.split(" ") || []; // Split the name into parts
      const firstName = nameParts[0] || ""; // First name is the first element
      const lastName =
        nameParts?.length > 1 ? nameParts[nameParts?.length - 1] : ""; // Last name is the last element, if it exists

      setValue("firstName", firstName);
      setValue("lastName", lastName);
      setValue("address", address.address || "");
      setValue("contact", address.contact || userInfo?.phone || "");  // Use saved contact or profile phone
      setValue("email", userInfo?.email || "");  // Always use the user's email
      setValue("city", address.city || "");
      setValue("country", address.country || "");
      setValue("zipCode", address.zipCode || "");
    } else {
      // Clear form fields except email and phone
      setValue("firstName", "");
      setValue("lastName", "");
      setValue("address", "");
      setValue("contact", userInfo?.phone || "");  // Keep user's phone from profile
      setValue("city", "");
      setValue("country", "");
      setValue("zipCode", "");
      
      // Keep the email field with user's email
      setValue("email", userInfo?.email || "");
    }
  };
  const handleCouponCode = async (e) => {
    e.preventDefault();

    if (!couponRef.current.value) {
      notifyError("Please Input a Coupon Code!");
      return;
    }
    setIsCouponAvailable(true);

    try {
      const coupons = await CouponServices.getShowingCoupons();
      const result = coupons.filter(
        (coupon) => coupon.couponCode === couponRef.current.value
      );
      setIsCouponAvailable(false);

      if (result.length < 1) {
        notifyError("Please Input a Valid Coupon!");
        return;
      }

      if (dayjs().isAfter(dayjs(result[0]?.endTime))) {
        notifyError("This coupon is not valid!");
        return;
      }

      if (total < result[0]?.minimumAmount) {
        notifyError(
          `Minimum ${result[0].minimumAmount} USD required for Apply this coupon!`
        );
        return;
      } else {
        notifySuccess(
          `Your Coupon ${result[0].couponCode} is Applied on ${result[0].productType}!`
        );
        setIsCouponApplied(true);
        setMinimumAmount(result[0]?.minimumAmount);
        setDiscountPercentage(result[0].discountType);
        dispatch({ type: "SAVE_COUPON", payload: result[0] });
        Cookies.set("couponInfo", JSON.stringify(result[0]));
      }
    } catch (error) {
      return notifyError(error.message);
    }
  };

  return {
    register,
    setValue, // Add setValue to the return object
    errors,
    showCard,
    setShowCard,
    error,
    couponInfo,
    couponRef,
    total,
    isEmpty,
    items,
    cartTotal,
    handleSubmit,
    submitHandler,
    handleShippingCost,
    handleCouponCode,
    handleLoyaltyPointsRedemption,
    discountPercentage,
    discountAmount,
    loyaltyDiscountAmount,
    setLoyaltyDiscountAmount,
    shippingCost,
    isCheckoutSubmit,
    isCouponApplied,
    useExistingAddress,
    hasShippingAddress,
    isCouponAvailable,
    handleDefaultShippingAddress,
  };
};

export default useCheckoutSubmit;
