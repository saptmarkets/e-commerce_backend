import { Avatar, TableBody, TableCell, TableRow } from "@windmill/react-ui";
import useUtilsFunction from "@/hooks/useUtilsFunction";

const AttributeList = ({ variants, variantTitle }) => {
  const { showingTranslateValue, currency, getNumberTwo } = useUtilsFunction();
  return (
    <>
      <TableBody>
        {variants?.map((variant, i) => (
          <TableRow key={i + 1}>
            <TableCell className="font-semibold uppercase text-xs">
              {i + 1}
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                {variant.image ? (
                  <Avatar
                    className="hidden p-1 mr-2 md:block bg-gray-50 shadow-none"
                    src={variant.image}
                    alt="product"
                  />
                ) : (
                  <Avatar
                    src="https://res.cloudinary.com/dxjobesyt/image/upload/v1752706908/placeholder_kvepfp_wkyfut.png"
                    alt="product"
                    className="hidden p-1 mr-2 md:block bg-gray-50 shadow-none"
                  />
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col text-sm">
                <span>
                  {variantTitle
                    ?.map((att) => {
                      const attributeData = att?.variants?.filter(
                        (val) => val?.name !== "All"
                      );

                      const attributeName = attributeData?.find(
                        (v) => v._id === variant[att?._id]
                      )?.name;
                      if (attributeName === undefined) {
                        return attributeName?.en;
                      } else {
                        return showingTranslateValue(attributeName);
                      }
                    })
                    ?.filter(Boolean)
                    .join(" ")}
                </span>
                {variant.productId && (
                  <span className="text-xs text-gray-500">
                    ({variant.productId})
                  </span>
                )}
              </div>
            </TableCell>

            <TableCell className="font-semibold uppercase text-xs">
              {variant.sku}
            </TableCell>
            <TableCell className="font-semibold uppercase text-xs">
              {variant.barcode}
            </TableCell>

            <TableCell className="font-semibold uppercase text-xs">
              {currency}
              {getNumberTwo(variant.originalPrice)}
            </TableCell>
            <TableCell className="font-semibold uppercase text-xs">
              {currency}
              {getNumberTwo(variant.price)}
            </TableCell>

            <TableCell className="font-semibold uppercase text-xs">
              {variant.quantity}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </>
  );
};

export default AttributeList;
