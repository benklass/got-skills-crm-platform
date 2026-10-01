import React from "react";
import { toast } from "react-toastify";
import Form from "./common/form";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import Receipt from "./reports/receipt/receipt";
import {
  getPayment,
  getPaymentByEnrollmentId,
} from "../services/paymentService";

class PrintReceipt extends Form {
  state = {
    payment: null,
    receiptError: "",
  };

  async componentDidMount() {
    await this.populatePaymentData();
  }

  async populatePaymentData() {
    try {
      // Preserve existing callers that supply paymentId or enrollmentId
      // through React Router location.state.
      const locationState = this.props.location.state || {};

      // NEW: Also support a direct URL opened in another tab, e.g.
      // /receiptPrint?paymentId=<MongoDB payment ID>.
      // The URL is independent of the original tab's router state.
      const query = new URLSearchParams(this.props.location.search || "");
      const paymentId = locationState.paymentId || query.get("paymentId");
      const enrollmentId =
        locationState.enrollmentId || query.get("enrollmentId");

      let response;
      if (paymentId) {
        // Prefer an exact payment ID if both identifiers are present.
        response = await getPayment(paymentId);
      } else if (enrollmentId) {
        // Existing Completion Form workflow remains supported.
        response = await getPaymentByEnrollmentId(enrollmentId);
      } else {
        this.setState({ receiptError: "Missing payment information." });
        toast.error("Missing payment information.");
        return;
      }

      this.setState({ payment: response.data, receiptError: "" });
    } catch (ex) {
      console.error("Unable to load receipt data:", ex);
      const errorMessage =
        ex.response && ex.response.data
          ? ex.response.data
          : "Unable to load receipt data.";
      this.setState({ receiptError: errorMessage });
      toast.error(errorMessage);
    }
  }

  render() {
    const { payment, receiptError } = this.state;

    if (receiptError) return <span>{receiptError}</span>;
    if (!payment) return <span>Loading Receipt Data ....</span>;

    // Keep the existing Receipt component's expected data shape.
    const receiptData = {
      id: payment._id,
      transactionId: parseInt(
        payment.enrollmentId.toString().substr(0, 10),
        16
      ),
      merchantId: payment.merchantId,
      paymentMethod: payment.paymentMethod,
      serviceProvider: payment.serviceProvider,
      spTransactionId: payment.spTransactionId,
      invoice_no: payment.productInvoice || "Missing invoice number",
      name: payment.name || "Missing Name",
      // The original model uses this spelling; do not rename the field.
      email: payment.confimationEmailAddress || "Missing Email",
      description: payment.productDescription || "Missing Item",
      trans_date: payment.transactionDate
        ? new Date(payment.transactionDate).toLocaleDateString("en-ZA", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "Missing Date",
      grossAmount:
        payment.grossAmount && payment.grossAmount.$numberDecimal
          ? payment.grossAmount.$numberDecimal
          : null,
    };

    return (
      <div className="App">
        <div>
          <PDFViewer width={800} height={1100}>
            <Receipt receipt={receiptData} />
          </PDFViewer>
        </div>
        <div className="text-center border-top">
          <PDFDownloadLink
            className="btn btn-primary mt-2 mr-2"
            document={<Receipt receipt={receiptData} />}
            fileName="document.pdf"
          >
            {({ blob, url, loading, error }) =>
              loading ? "Loading document..." : "Download"
            }
          </PDFDownloadLink>
          {this.renderLink("/payments", "Exit")}
        </div>
      </div>
    );
  }
}

export default PrintReceipt;
