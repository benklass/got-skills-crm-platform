import React, { Fragment } from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  companyContainer: {
    flexDirection: "row",
    marginTop: 24,
  },
  titleContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  reportCompany: {
    color: "grey",
    letterSpacing: 4,
    fontSize: 24,
    textAlign: "center",
    textTransform: "uppercase",
  },
  reportTitle: {
    color: "#61dafb",
    letterSpacing: 4,
    fontSize: 20,
    textAlign: "center",
    textTransform: "uppercase",
  },
});

const InvoiceTitle = ({ title, company }) => (
  <Fragment>
    <View style={styles.companyContainer}>
      <Text style={styles.reportCompany}>{company}</Text>
    </View>
    <View style={styles.titleContainer}>
      <Text style={styles.reportTitle}>{title}</Text>
    </View>
  </Fragment>
);

export default InvoiceTitle;
