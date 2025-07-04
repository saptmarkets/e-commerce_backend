import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import dayjs from "dayjs";
// helper tLabel defined internally below

// Register DejaVu Sans which includes Arabic currency symbol ﷼
Font.register({
  family: "DejaVuSans",
  src:
    "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.0/ttf/DejaVuSans.ttf",
});

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
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
    alignSelf: "flex-end",
  },
  title: {
    color: "#2f3032",
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 8.1,
    textTransform: "uppercase",
  },
  info: {
    fontSize: 9,
    color: "#6b7280",
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
    fontFamily: "Helvetica",
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
    fontFamily: "Helvetica",
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
    fontFamily: "Helvetica",
    fontWeight: "bold",
    width: "25%",
  },
  titleRight: {
    textAlign: "right",
    fontFamily: "Helvetica",
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
    const unitName = item.unitName || 'pcs';
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

  return (
    <>
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.invoiceFirst}>
            <View>
              <Text style={{ fontFamily: "Helvetica", fontWeight: "bold" }}>
                INVOICE
              </Text>
              <Text style={styles.info}>Status : {data?.status}</Text>
            </View>
            <View style={styles.topBg}>
              <Text style={styles.logo}>SAPT MARKETS</Text>
              <Text style={styles.topAddress}>
                {globalSetting?.address ||
                  "Cecilia Chapman, 561-4535 Nulla LA, United States 96522"}
              </Text>
              {/* <Text style={styles.info}> United States 96522</Text> */}
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
              <Text style={styles.title}>INVOICE NO</Text>
              <Text style={styles.info}>#{data?.invoice}</Text>
            </View>
            <View>
              <Text style={styles.title}>INVOICE TO</Text>
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
                  <Text style={styles.header}>Sr.</Text>
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  <Text style={styles.header}>Product Name</Text>
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  <Text style={styles.header}>Quantity</Text>
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  <Text style={styles.header}>Item Price</Text>
                </Text>
              </View>

              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {" "}
                  <Text style={styles.header}>Amount</Text>
                </Text>
              </View>
            </View>
            {data?.cart?.map((item, i) => {
              const unitInfo = getUnitDisplayInfo(item);
              return (
                <View key={i} style={styles.tableRow}>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{i + 1}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{showingTranslateValue ? showingTranslateValue(item.title) : item.title}</Text>
                    {unitInfo.hasMultiUnit && (
                      <Text style={{ fontSize: 7, color: '#6b7280' }}>Unit: {unitInfo.unitDisplay} ({unitInfo.totalBaseUnits} total pcs)</Text>
                    )}
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      <Text style={styles.quantity}>{item.quantity}</Text>
                    </Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      <Text style={styles.quantity}>
                        {currency}
                        {getNumberTwo(item.price)}
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      <Text style={styles.amount}>
                        {currency}
                        {getNumberTwo(item.itemTotal ?? item.price * item.quantity)}
                      </Text>
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.invoiceThird}>
            <View>
              <Text style={styles.title}> Payment Method</Text>
              <Text style={styles.info}> {data.paymentMethod} </Text>
            </View>
            <View>
              <Text style={styles.title}>Shipping Cost</Text>
              <Text style={styles.info}>
                {currency}
                {getNumberTwo(data.shippingCost ?? 0)}
              </Text>
            </View>
            <View>
              <Text style={styles.title}>Discount</Text>
              <Text style={styles.info}>
                {" "}
                {currency}
                {getNumberTwo(data.discount ?? 0)}
              </Text>
            </View>

            <View>
              <Text style={styles.title}>Total Amount</Text>
              <Text style={styles.amount}>
                {currency}
                {getNumberTwo(data.total)}
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
              Thank you <Text style={styles.thanks}>{data.name},</Text> Your
              order have been received !
            </Text>
          </View>
        </Page>
      </Document>
    </>
  );
};

export default InvoiceForDownload;
