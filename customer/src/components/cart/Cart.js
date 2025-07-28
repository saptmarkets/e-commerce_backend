import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useMemo } from "react";
import { IoBagCheckOutline, IoClose } from "react-icons/io5";
import { useCart } from "react-use-cart";
import useTranslation from "next-translate/useTranslation";

//internal import
import CartItem from "@components/cart/CartItem";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { SidebarContext } from "@context/SidebarContext";

const Cart = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { closeCartDrawer } = useContext(SidebarContext);
  const { isEmpty, items } = useCart();
  const { currency, lang } = useUtilsFunction();

  const formatPrice = (val) => {
    const value = parseFloat(val || 0).toFixed(2);
    if (lang === 'ar') {
      return (
        <span className="inline-flex items-center whitespace-nowrap">
          {value}&nbsp;<span className="font-saudi_riyal">{currency}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center whitespace-nowrap">
        <span className="font-saudi_riyal">{currency}</span>&nbsp;{value}
      </span>
    );
  };

  // Calculate the correct cart total with promotional prices
  const cartTotal = useMemo(() => {
    return items.reduce((total, item) => {
      // If no promotion
      if (!item.promotion) {
        return total + ((item.price || 0) * item.quantity);
      }

      // If within max quantity or no max quantity defined
      if (item.quantity <= item.maxQty || !item.maxQty) {
        return total + ((item.price || 0) * item.quantity);
      } else {
        // Apply promotional price up to maxQty, then regular price for the rest
        const promotionSubtotal = (item.price || 0) * item.maxQty;
        const regularSubtotal = (item.basePrice || 0) * (item.quantity - item.maxQty);
        return total + promotionSubtotal + regularSubtotal;
      }
    }, 0);
  }, [items]);

  const handleCheckout = () => {
    closeCartDrawer();
    router.push("/checkout");
  };

  return (
    <div className="flex flex-col w-full h-full justify-between items-middle bg-white rounded cursor-pointer">
      <div className="w-full flex justify-between items-center relative px-5 py-4 border-b bg-emerald-50 border-gray-100">
        <h2 className="font-semibold text-lg m-0 text-heading flex items-center">
          <span className="text-xl mr-2 mb-1">
            <IoBagCheckOutline />
          </span>
          {t("common:shoppingCartDrawerTitle")}
        </h2>
        <button
          onClick={closeCartDrawer}
          className="flex text-2xl items-center justify-center text-gray-500 hover:text-red-400 transition-all"
        >
          <IoClose />
        </button>
      </div>

      <div className="overflow-y-scroll flex-grow scrollbar-hide w-full max-h-full">
        {isEmpty && (
          <div className="flex flex-col h-full justify-center">
            <div className="flex flex-col items-center">
              <div className="text-center">
                <p className="text-gray-500 text-sm">
                  {t("common:cartEmptyText")}
                </p>
              </div>
            </div>
          </div>
        )}

        {!isEmpty &&
          items.map((item) => (
            <CartItem key={item.id} item={item} currency={currency} />
          ))}
      </div>

      <div className="mx-5 my-4">
        {!isEmpty && (
          <div className="flex items-center justify-between">
            <div className="font-medium">
              <p>{t("common:subtotal")}:</p>
            </div>
            <div className="font-bold text-lg">{formatPrice(cartTotal)}</div>
          </div>
        )}
        <div className="flex items-center justify-between mt-4">
          <div className="w-full">
            {!isEmpty && (
              <button
                onClick={handleCheckout}
                className="w-full py-3 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white focus:outline-none transition-all"
              >
                {t("common:proceedToCheckoutBtn")}
              </button>
            )}
            {isEmpty && (
              <Link href="/">
                <button className="w-full py-3 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white focus:outline-none transition-all">
                  {t("common:continueShoppingBtn")}
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart; 