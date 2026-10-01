import React from "react";
import { Page, Text, Document, Image, StyleSheet } from "@react-pdf/renderer";

import ReceiptTitle from "./ReceiptTitle";
import ReceiptTo from "./ReceiptTo";
import ReceiptNo from "./ReceiptNo";
import ReceiptItemsTable from "./ReceiptItemsTable";
import ReceiptThankYouMsg from "./ReceiptThankYouMsg";
import logo from "../../../assets/packs-logo.png";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    lineHeight: 1.5,
    flexDirection: "column",
  },
  logo: {
    width: 74,
    height: 66,
    marginLeft: "auto",
    marginRight: "auto",
  },
  pageNumber: {
    position: "absolute",
    fontSize: 12,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "grey",
  },
});

const Receipt = ({ receipt }) => (
  <Document>
    <Page size="A5" style={styles.page}>
      <ReceiptTitle title="Receipt" company="Got Skills" />
      <ReceiptNo receipt={receipt} />
      <ReceiptThankYouMsg />
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </Page>
  </Document>
);

export default Receipt;
