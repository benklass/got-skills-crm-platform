import React from "react";
import { View, StyleSheet } from "@react-pdf/renderer";
import ReceiptTableHeader from "./ReceiptTableHeader";
import ReceiptTableRow from "./ReceiptTableRow";
import ReceiptTableBlankSpace from "./ReceiptTableBlankSpace";
import ReceiptTableFooter from "./ReceiptTableFooter";

const tableRowsCount = 6;

const styles = StyleSheet.create({
  tableContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#bff0fd",
  },
});

const ReceiptItemsTable = ({ receipt }) => (
  <View style={styles.tableContainer}>
    <ReceiptTableHeader />
    <ReceiptTableRow items={receipt.items} />
    <ReceiptTableBlankSpace rowsCount={tableRowsCount - receipt.items.length} />
    <ReceiptTableFooter items={receipt.items} />
  </View>
);

export default ReceiptItemsTable;
