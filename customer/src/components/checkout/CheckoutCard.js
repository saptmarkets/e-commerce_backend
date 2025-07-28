import Image from "next/image";
import { useCart } from "react-use-cart";
import { FiPlus, FiMinus } from "react-icons/fi";
import useTranslation from "next-translate/useTranslation";

//internal imports
import { getUnitDisplayName } from '@utils/unitUtils';
import useUtilsFunction from "@hooks/useUtilsFunction";

const CheckoutCard = ({ item }) => {
  const { updateItemQuantity } = useCart();

  const { currency } = useUtilsFunction();
  const { t } = useTranslation();
  const { lang } = useUtilsFunction();

  // Get multi-unit display information
  const getUnitDisplayInfo = () => {
    if (!item.isMultiUnit && !item.packQty) return null;
    
    const unitName = getUnitDisplayName(item.unit, lang);
    const packQty = item.packQty || 1;
    const totalBaseUnits = item.quantity * packQty;
    
    return {
      unitName,
      packQty,
      totalBaseUnits,
      displayText: packQty > 1 ? `${unitName} (${packQty} ${t("common:pcs")})` : unitName,
      hasMultiUnit: packQty > 1
    };
  };

  const unitInfo = getUnitDisplayInfo();

  return (
    <div
      key={item.id}
      className="group w-full h-auto flex justify-start items-center py-2 px-5 border-b hover:bg-white transition-all border-gray-100 relative last:border-b-0"
    >
      <div className="relative flex rounded-md overflow-hidden flex-shrink-0 cursor-pointer mr-4">
        <Image src={item.image} width={50} height={50} alt={item.title} />
      </div>
      
      <div className="flex flex-col w-full overflow-hidden">
        <h6 className="text-sm font-medium text-gray-700 mb-1">
          {item.title}
        </h6>
        
        {/* Multi-unit information */}
        {unitInfo && (
          <div className="text-xs text-blue-600 mb-1">
            <span className="font-medium">{unitInfo.displayText}</span>
            {unitInfo.hasMultiUnit && (
              <span className="ml-2 text-gray-500">
                • {t("common:total")}: {unitInfo.totalBaseUnits} {t("common:baseUnits")}
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="font-bold text-sm text-heading leading-5">
            <span>
              {currency}
              {(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
          <div className="h-8 w-22 md:w-24 lg:w-24 flex flex-wrap items-center justify-evenly p-1 border border-gray-100 bg-white text-gray-600 rounded-md">
            <button
              onClick={() =>
                updateItemQuantity(item.id, item.quantity - 1)
              }
            >
              <span className="text-dark text-base">
                <FiMinus />
              </span>
            </button>
            <p className="text-sm font-semibold text-dark px-1">
              {item.quantity}
            </p>
            <button
              onClick={() =>
                updateItemQuantity(item.id, item.quantity + 1)
              }
            >
              <span className="text-dark text-base">
                <FiPlus />
              </span>
            </button>
          </div>
        </div>
        
        {/* Additional unit details for checkout */}
        {unitInfo && unitInfo.hasMultiUnit && (
          <div className="text-xs text-gray-500 mt-2">
            <div className="flex justify-between items-center">
              <span>{t("common:unitPrice")}</span>
              <span>{currency}{item.price?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t("common:pricePerPiece")}</span>
              <span>{currency}{(item.price / unitInfo.packQty)?.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutCard;
