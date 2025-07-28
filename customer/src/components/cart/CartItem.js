import { useContext } from "react";
import Link from "next/link";
import { useCart } from "react-use-cart";
import { FiPlus, FiMinus, FiTrash2 } from "react-icons/fi";

//internal import
import useAddToCart from "@hooks/useAddToCart";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { SidebarContext } from "@context/SidebarContext";
import { getLocalizedUnitName } from '@utils/unitUtils';

const CartItem = ({ item, currency }) => {
  const { updateItemQuantity, removeItem } = useCart();
  const { closeCartDrawer } = useContext(SidebarContext);
  const { handleIncreaseQuantity } = useAddToCart();
  const { tr, lang } = useUtilsFunction();

  const formatPrice = (val) => {
    const displayCurrency = lang === 'ar' ? 'ريال' : currency;
    const value = parseFloat(val || 0).toFixed(2);
    return lang === 'ar' ? `${value} ${displayCurrency}` : `${displayCurrency} ${value}`;
  };

  // Calculate the correct item price based on promotion
  const calculateItemPrice = () => {
    // If no promotion, use regular price
    if (!item.promotion) {
      return item.price || 0;
    }

    // If quantity is below minimum, still use the promotion price
    // because we enforced minimum quantity when adding to cart
    if (item.quantity <= item.maxQty || !item.maxQty) {
      // Use the promotion price for each item
      return item.price || 0;
    } else {
      // For quantities beyond maxQty, calculate the blended price:
      // (promotion price * maxQty + regular price * (quantity - maxQty)) / quantity
      const promotionSubtotal = (item.price || 0) * item.maxQty;
      const regularSubtotal = (item.basePrice || 0) * (item.quantity - item.maxQty);
      return (promotionSubtotal + regularSubtotal) / item.quantity;
    }
  };

  // Calculate the total price for the item
  const calculateTotalPrice = () => {
    if (!item.promotion) {
      return ((item.price || 0) * item.quantity).toFixed(2);
    }

    if (item.quantity <= item.maxQty || !item.maxQty) {
      return ((item.price || 0) * item.quantity).toFixed(2);
    } else {
      // Apply promotional price up to maxQty, then regular price for the rest
      const promotionSubtotal = (item.price || 0) * item.maxQty;
      const regularSubtotal = (item.basePrice || 0) * (item.quantity - item.maxQty);
      return (promotionSubtotal + regularSubtotal).toFixed(2);
    }
  };

  // Handle quantity updates with promotion constraints
  const handleDecrease = () => {
    // For combo deals, only allow removal, not quantity decrease
    if (item.isCombo) {
      removeItem(item.id);
      return;
    }
    
    // If it's a promotional item with minQty and quantity equals minQty, remove the item
    if (item.promotion && item.minQty > 1 && item.quantity === item.minQty) {
      removeItem(item.id);
    } else {
      updateItemQuantity(item.id, item.quantity - 1);
    }
  };

  // Get multi-unit display information
  const getUnitDisplayInfo = () => {
    if (!item.isMultiUnit && !item.packQty) return null;
    
    const unitName = getLocalizedUnitName(item.unit, lang);
    const packQty = item.packQty || 1;
    const totalBaseUnits = item.quantity * packQty;
    
    return {
      unitName,
      packQty,
      totalBaseUnits,
      displayText: packQty > 1 ? `${unitName} (${packQty} pcs)` : unitName
    };
  };

  const unitInfo = getUnitDisplayInfo();

  return (
    <div className="group w-full h-auto flex justify-start items-center bg-white py-3 px-4 border-b hover:bg-gray-50 transition-all border-gray-100 relative last:border-b-0">
      <div className="relative flex rounded-full border border-gray-100 shadow-sm overflow-hidden flex-shrink-0 cursor-pointer mr-4">
        <img
          key={item.id}
          src={item.image}
          width={40}
          height={40}
          alt={item.title}
        />
      </div>
      <div className="flex flex-col w-full overflow-hidden">
        <Link
          href={`/product/${item.slug}`}
          onClick={closeCartDrawer}
          className="truncate text-sm font-medium text-gray-700 text-heading line-clamp-1"
        >
          {item.title}
        </Link>
        
        {/* Multi-unit information */}
        {unitInfo && (
          <div className="text-xs text-blue-600 mb-1">
            <span className="font-medium">{unitInfo.displayText}</span>
            {unitInfo.packQty > 1 && (
              <span className="ml-2 text-gray-500">
                {tr('Total:', 'الإجمالي:')} {unitInfo.totalBaseUnits} {tr('base units', 'وحدة أساسية')}
              </span>
            )}
          </div>
        )}
        
        <span className="text-xs text-gray-400 mb-1">
          {tr('Item Price','سعر العنصر')} {formatPrice(calculateItemPrice())}
          {item.promotion && (
            <span className="ml-1 text-green-500">
              ({tr('Special Offer','عرض خاص')})
            </span>
          )}
        </span>
        {item.promotion && item.minQty > 1 && (
          <span className="text-xs text-orange-500 mb-1">
            {tr('Min quantity','الحد الأدنى للكمية')}: {item.minQty} {getLocalizedUnitName(item.unit, lang)}
          </span>
        )}
        <div className="flex items-center justify-between">
          <div className="font-bold text-sm md:text-base text-heading leading-5">
            <span>{formatPrice(calculateTotalPrice())}</span>
            {item.isCombo && (
              <div className="inline-block ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {tr('Combo Deal','صفقة مجمعة')}
              </div>
            )}
          </div>
          <div className={`h-8 w-22 md:w-24 lg:w-24 flex flex-wrap items-center justify-evenly p-1 border border-gray-100 bg-white text-gray-600 rounded-md ${item.isCombo ? 'bg-purple-50 border-purple-200' : ''}`}>
            <button
              onClick={handleDecrease}
              disabled={item.isCombo}
              className={item.isCombo ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <span className="text-dark text-base">
                <FiMinus />
              </span>
            </button>
            <p className={`text-sm font-semibold px-1 ${item.isCombo ? 'text-purple-600' : 'text-dark'}`}>
              {item.quantity}
              {item.isCombo && <span className="text-xs text-purple-500 ml-1">(fixed)</span>}
            </p>
            <button 
              onClick={() => handleIncreaseQuantity(item)}
              disabled={item.isCombo}
              className={item.isCombo ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <span className="text-dark text-base">
                <FiPlus />
              </span>
            </button>
          </div>
          <button
            onClick={() => removeItem(item.id)}
            className="hover:text-red-600 text-red-400 text-lg cursor-pointer"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
