import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import dayjs from "dayjs";
import { getUnitDisplayName } from '@utils/unitUtils';
// helper tLabel defined internally below

// Register DejaVu Sans which includes Arabic currency symbol ﷼
try {
  Font.register({
    family: "DejaVuSans",
    src:
      "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.0/ttf/DejaVuSans.ttf",
  });
} catch (error) {
  // Fallback to default font if registration fails
  console.warn('Font registration failed, using default font:', error);
}

// Default PDF fonts are used; custom font registration removed to avoid network fetch issues.
const styles = StyleSheet.create({
  page: {
    marginRight: 10,
    marginBottom: 20,
    marginLeft: 10,
    paddingTop: 30,
    paddingLeft: 10,
    paddingRight: 29,
    lineHeight: 1.5,
    fontFamily: "DejaVuSans",
  },
  table: {
    display: "table",
    width: "auto",
    color: "#4b5563",
    marginRight: 10,
    marginBottom: 20,
    marginLeft: 10,
    marginTop: 12,
    borderRadius: 8,
    borderColor: "#e9e9e9",
    borderStyle: "solid",
    borderWidth: 0.5,
    padding: 0,
    textAlign: "left",
  },
  tableRow: {
    // margin: 'auto',
    flexDirection: "row",
    paddingBottom: 2,
    paddingTop: 2,
    textAlign: "left",
    borderWidth: 0.8,
    borderColor: "#E5E7EB",
    borderBottom: 0,
  },
  tableRowHeder: {
    // margin: 'auto',
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    paddingBottom: 4,
    paddingTop: 4,
    paddingLeft: 0,
    borderBottomWidth: 0.8,
    borderColor: "#E5E7EB",
    borderStyle: "solid",
    textTransform: "uppercase",
    textAlign: "left",
  },
  tableCol: {
    width: "25%",
    textAlign: "left",

    // borderStyle: 'solid',
    // borderWidth: 1,
    // borderLeftWidth: 0.5,
    // borderTopWidth: 0.5,
    // borderBottomWidth: 0.5,
    // borderColor: '#d1d5db',
  },
  tableCell: {
    margin: "auto",
    marginTop: 5,
    fontSize: 10,
    // textAlign:'center',
    paddingLeft: "0",
    paddingRight: "0",
    marginLeft: 13,
    marginRight: 13,
  },

  tableCellQuantity: {
    margin: "auto",
    marginTop: 5,
    fontSize: 10,
    textAlign: "center",
    paddingLeft: "0",
    paddingRight: "0",
    marginLeft: 12,
    marginRight: 12,
  },

  invoiceFirst: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 18,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottom: 1,
    borderColor: "#f3f4f6",
    // backgroundColor:'#EEF2FF',
  },
  invoiceSecond: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 10,
    // backgroundColor:'#EEF2FF',
    paddingLeft: 10,
    paddingRight: 10,
  },
  invoiceThird: {
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 10,
    paddingRight: 10,
    borderTop: 1,
    borderColor: "#ffffff",
    backgroundColor: "#f4f5f7",
    borderRadius: 12,
    marginLeft: 13,
    marginRight: 13,

    // backgroundColor:'#F2FCF9',
  },
  logo: {
    textAlign: "right",
    color: "#4b5563",
    fontFamily: "DejaVuSans",
    fontWeight: "bold",
    fontSize: 14,
    alignSelf: "flex-end",
  },
  title: {
    color: "#2f3032",
    fontFamily: "DejaVuSans",
    fontWeight: "bold",
    fontSize: 8.1,
    textTransform: "uppercase",
  },
  info: {
    fontSize: 9,
    color: "#6b7280",
    fontFamily: "DejaVuSans",
  },
  infoCost: {
    fontSize: 10,
    color: "#6b7280",
    marginLeft: 10,
    marginTop: 7,
    textAlign: "left",
    width: "25%",
  },
  invoiceNum: {
    fontSize: 9,
    color: "#6b7280",
    marginLeft: 6,
  },
  topAddress: {
    fontSize: 10,
    color: "#6b7280",
  },
  amount: {
    fontSize: 10,
    color: "#ef4444",
  },
  totalAmount: {
    fontSize: 10,
    color: "#ef4444",
    fontFamily: "DejaVuSans",
    fontWeight: "bold",
    textTransform: "uppercase",
    textAlign: "right",
  },
  status: {
    color: "#10b981",
  },
  quantity: {
    color: "#1f2937",
    textAlign: "center",
  },
  itemPrice: {
    color: "#1f2937",
    textAlign: "left",
  },
  header: {
    color: "#6b7280",
    fontSize: 9,
    fontFamily: "DejaVuSans",
    fontWeight: "bold",
    textTransform: "uppercase",
    textAlign: "left",
  },

  thanks: {
    color: "#22c55e",
  },
  infoRight: {
    textAlign: "right",
    fontSize: 9,
    color: "#6b7280",
    fontFamily: "DejaVuSans",
    fontWeight: "bold",
    width: "25%",
  },
  titleRight: {
    textAlign: "right",
    fontFamily: "DejaVuSans",
    fontWeight: "bold",
    fontSize: 8.1,
    width: "25%",
    textTransform: "uppercase",
    color: "#2f3032",
  },
  topBg: {
    // backgroundColor:'#EEF2FF',
  },
  invoiceDiv: {
    alignItems: "baseline",
  },
});

export const InvoiceForDownload = ({
  data,
  currency,
  globalSetting,
  getNumberTwo,
  showingTranslateValue,
  lang,
}) => {
  // Helper to compute unit info similar to OrderTable
  const getUnitDisplayInfo = (item) => {
    const unitName = getUnitDisplayName(item.unit, lang);
    const packQty = item.packQty || 1;
    const totalBaseUnits = item.quantity * packQty;

    if (packQty > 1) {
      return {
        unitDisplay: `${unitName} (${packQty} pcs each)`,
        totalBaseUnits,
        hasMultiUnit: true,
      };
    }
    return {
      unitDisplay: unitName,
      totalBaseUnits: item.quantity,
      hasMultiUnit: false,
    };
  };

  const tLabel = (en, ar) => (lang === 'ar' ? ar : en);

  // Map order status to Arabic when needed
  const translateStatus = (status) => {
    if (lang !== 'ar') return status;
    const map = {
      'Delivered': 'تم التوصيل',
      'Received': 'تم الاستلام',
      'Processing': 'قيد المعالجة',
      'Out for Delivery': 'قيد التوصيل',
      'Cancel': 'تم الإلغاء',
      'Cancelled': 'تم الإلغاء',
    };
    return map[status] || status;
  };

  // Format price based on language direction with stylish Saudi Riyal symbol
  const formatPrice = (value = 0) => {
    const amount = getNumberTwo(value);
    const riyalSymbol = '\uE900'; // Saudi Riyal Unicode character
    
    if (lang === 'ar') {
      return `${amount} ${riyalSymbol}`;
    } else {
      return `${riyalSymbol}${amount}`;
    }
  };

  return (
    <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.invoiceFirst}>
            <View>
              <Text style={{ fontFamily: "DejaVuSans", fontWeight: "bold" }}>
                {tLabel('INVOICE', 'الفاتورة')}
              </Text>
              <Text style={styles.info}>{tLabel('Status', 'الحالة')} : {translateStatus(data?.status)}</Text>
            </View>
            <View style={styles.topBg}>
              <Text style={styles.logo}>{tLabel('SAPT MARKETS','اسواق سبت المركزية')}</Text>
            </View>
          </View>

          <View style={styles.invoiceSecond}>
            <View>
              <Text style={styles.title}>{tLabel('DATE','التاريخ')}</Text>
              <Text style={styles.info}>
                {dayjs(data?.createdAt).format("MMMM D, YYYY")}
              </Text>
            </View>
            <View>
              <Text style={styles.title}>{tLabel('INVOICE NO', 'رقم الفاتورة')}</Text>
              <Text style={styles.info}>#{data?.invoice}</Text>
            </View>
            <View>
              <Text style={styles.title}>{tLabel('INVOICE TO', 'الفاتورة إلى')}</Text>
              <Text style={styles.info}>{data?.user_info?.name}</Text>
              <Text style={styles.info}>
                {" "}
                {data?.user_info?.address?.substring(0, 25)}
              </Text>
              <Text style={styles.info}>
                {data?.user_info?.city}, {data?.user_info?.country},{" "}
                {data?.user_info?.zipCode}
              </Text>
            </View>
          </View>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  <Text style={styles.header}>{tLabel('Sr.', 'الرقم التسلسلي.')}</Text>
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  <Text style={styles.header}>{tLabel('Product Name', 'اسم المنتج')}</Text>
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  <Text style={styles.header}>{tLabel('Quantity', 'الكمية')}</Text>
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  <Text style={styles.header}>{tLabel('Item Price', 'سعر العنصر')}</Text>
                </Text>
              </View>

              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {" "}
                  <Text style={styles.header}>{tLabel('Amount', 'المبلغ')}</Text>
                </Text>
              </View>
            </View>
            {(() => {
              let rowIndex = 0;
              const rows = [];
              
              data?.cart?.forEach((item, i) => {
                const unitInfo = getUnitDisplayInfo(item);
                const isCombo = item.comboDetails && item.comboDetails.productBreakdown;
                
                if (isCombo) {
                  // Add combo header row
                  rows.push(
                    <View key={`${i}-header`} style={styles.tableRow}>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>{rowIndex + 1}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                          <Text style={{ fontWeight: 'bold', color: '#7c3aed' }}>
                            {showingTranslateValue ? showingTranslateValue(item.title) : item.title}
                          </Text>
                          <Text style={{ fontSize: 8, color: '#6b7280' }}>
                            {tLabel('Combo Deal', 'عرض باقة')} • {item.comboDetails.productBreakdown?.length || 0} {tLabel('items', 'عناصر')}
                          </Text>
                        </Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                          <Text style={styles.quantity}>{item.quantity}</Text>
                        </Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                          <Text style={styles.quantity}>{formatPrice(item.price)}</Text>
                        </Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                          <Text style={styles.amount}>{formatPrice(item.itemTotal ?? item.price * item.quantity)}</Text>
                        </Text>
                      </View>
                    </View>
                  );
                  rowIndex++;
                  
                  // Add individual combo products
                  item.comboDetails.productBreakdown?.forEach((comboProduct, j) => {
                    rows.push(
                      <View key={`${i}-combo-${j}`} style={[styles.tableRow, { backgroundColor: '#f9fafb' }]}>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCell}></Text>
                        </View>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCell}>
                            <Text style={{ fontSize: 9, color: '#6b7280' }}>
                              {comboProduct.productTitle}
                            </Text>
                            <Text style={{ fontSize: 7, color: '#9ca3af' }}>
                              ({getUnitDisplayName(comboProduct.unit, lang)})
                            </Text>
                          </Text>
                        </View>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCell}>
                            <Text style={{ fontSize: 9, color: '#6b7280' }}>{comboProduct.quantity}</Text>
                          </Text>
                        </View>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCell}>
                            <Text style={{ fontSize: 9, color: '#6b7280' }}>{formatPrice(comboProduct.unitPrice || 0)}</Text>
                          </Text>
                        </View>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCell}>
                            <Text style={{ fontSize: 9, color: '#6b7280' }}>{formatPrice((comboProduct.unitPrice || 0) * comboProduct.quantity)}</Text>
                          </Text>
                        </View>
                      </View>
                    );
                  });
                  
                  // Add combo total row
                  rows.push(
                    <View key={`${i}-total`} style={[styles.tableRow, { backgroundColor: '#f3f4f6', borderTopWidth: 1, borderColor: '#d1d5db' }]}>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}></Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#7c3aed' }}>
                            {tLabel('Combo Total', 'إجمالي الباقة')} ({item.comboDetails?.totalSelectedQty || item.quantity} {tLabel('items', 'عناصر')})
                          </Text>
                        </Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#7c3aed' }}>
                            {item.quantity} {tLabel('combo', 'باقة')}{item.quantity > 1 ? 's' : ''}
                          </Text>
                        </Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#7c3aed' }}>
                            {formatPrice(item.comboDetails?.pricePerItem || item.price)}
                          </Text>
                        </Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#7c3aed' }}>
                            {formatPrice(item.comboDetails?.totalValue || (item.price * item.quantity))}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  );
                } else {
                  // Regular product row
                  rows.push(
                    <View key={i} style={styles.tableRow}>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>{rowIndex + 1}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>{showingTranslateValue ? showingTranslateValue(item.title) : item.title}</Text>
                        {unitInfo.hasMultiUnit && (
                          <Text style={{ fontSize: 7, color: '#6b7280' }}>{tLabel('Unit', 'وحدة')}: {unitInfo.unitDisplay} ({unitInfo.totalBaseUnits} {tLabel('total pcs', 'إجمالي القطع')})</Text>
                        )}
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                          <Text style={styles.quantity}>{item.quantity}</Text>
                        </Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                          <Text style={styles.quantity}>{formatPrice(item.price)}</Text>
                        </Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                          <Text style={styles.amount}>{formatPrice(item.itemTotal ?? item.price * item.quantity)}</Text>
                        </Text>
                      </View>
                    </View>
                  );
                  rowIndex++;
                }
              });
              
              return rows;
            })()}
          </View>

          <View style={styles.invoiceThird}>
            <View>
              <Text style={styles.title}>{tLabel('Payment Method', 'طريقة الدفع')}</Text>
              <Text style={styles.info}> {data.paymentMethod} </Text>
            </View>
            <View>
              <Text style={styles.title}>{tLabel('Shipping Cost', 'تكلفة الشحن')}</Text>
              <Text style={styles.info}>
                {formatPrice(data.shippingCost ?? 0)}
              </Text>
            </View>
            <View>
              <Text style={styles.title}>{tLabel('Discount', 'الخصم')}</Text>
              <Text style={styles.info}>
                {" "}
                {formatPrice(data.discount ?? 0)}
              </Text>
            </View>

            <View>
              <Text style={styles.title}>{tLabel('Total Amount', 'المبلغ الإجمالي')}</Text>
              <Text style={styles.amount}>
                {formatPrice(data.total)}
              </Text>
            </View>
          </View>

          <View
            style={{
              textAlign: "center",
              fontSize: 12,
              paddingBottom: 50,
              paddingTop: 50,
            }}
          >
            <Text>
              {tLabel('Thank you', 'شكراً لك')} <Text style={styles.thanks}>{data.name},</Text> {tLabel('Your order have been received !', 'تم استلام طلبك!')}
            </Text>
          </View>
        </Page>
      </Document>
  );
};

export default InvoiceForDownload;
