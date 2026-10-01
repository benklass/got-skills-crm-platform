import React, { Fragment } from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  receiptNoContainer: {
    flexDirection: "row",
    marginTop: 2,
    justifyContent: "flex-start",
  },
  receiptDateContainer: {
    flexDirection: "row",
    marginTop: 2,
    justifyContent: "flex-start",
  },
  receiptDate: {
    fontSize: 10,
    fontStyle: "bold",
    width: 200,
    justifyContent: "flex-end",
  },
  label: {
    fontSize: 10,
    width: 125,
    justifyContent: "flex-start",
  },
});

const ReceiptNo = ({ receipt }) => (
  <Fragment>
    <View style={styles.receiptDateContainer}>
      <Text style={styles.label}>Transaction Date,Time: </Text>
      <Text style={styles.receiptDate}>{receipt.trans_date}</Text>
    </View>
    <View style={styles.receiptNoContainer}>
      <Text style={styles.label}>Transaction Id : </Text>
      <Text style={styles.receiptDate}>{receipt.transactionId}</Text>
    </View>
    <View style={styles.receiptNoContainer}>
      <Text style={styles.label}>Transaction Amount:</Text>
      <Text style={styles.receiptDate}>{receipt.grossAmount}</Text>
    </View>
    <View style={styles.receiptNoContainer}>
      <Text style={styles.label}>Merchant Id:</Text>
      <Text style={styles.receiptDate}>{receipt.merchantId}</Text>
    </View>
    <View style={styles.receiptNoContainer}>
      <Text style={styles.label}>Payment Method:</Text>
      <Text style={styles.receiptDate}>{receipt.paymentMethod}</Text>
    </View>
    <View style={styles.receiptNoContainer}>
      <Text style={styles.label}>Service Provider:</Text>
      <Text style={styles.receiptDate}>{receipt.serviceProvider}</Text>
    </View>
    <View style={styles.receiptNoContainer}>
      <Text style={styles.label}>Provider Transaction:</Text>
      <Text style={styles.receiptDate}>{receipt.spTransactionId}</Text>
    </View>

    <View style={styles.receiptNoContainer}>
      <Text style={styles.label}>Invoice Number:</Text>
      <Text style={styles.receiptDate}>{receipt.invoice_no}</Text>
    </View>
    <View style={styles.receiptNoContainer}>
      <Text style={styles.label}>Receipt To:</Text>
      <Text style={styles.receiptDate}>{receipt.name}</Text>
    </View>
    <View style={styles.receiptNoContainer}>
      <Text style={styles.label}>Item Description:</Text>
      <Text style={styles.receiptDate}>{receipt.description}</Text>
    </View>
  </Fragment>
);

export default ReceiptNo;
