import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  headerContainer: {
    marginTop: 36,
  },
  receiptTo: {
    marginTop: 20,
    paddingBottom: 3,
    fontFamily: "Helvetica-Oblique",
  },
});

const ReceiptTo = ({ receipt }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.receiptTo}>Receipt To:</Text>
    <Text>{receipt.name}</Text>
    <Text>{receipt.address}</Text>
    <Text>{receipt.phone}</Text>
    <Text>{receipt.email}</Text>
  </View>
);

export default ReceiptTo;
