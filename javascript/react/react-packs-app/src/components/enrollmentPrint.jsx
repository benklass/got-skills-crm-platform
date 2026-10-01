import React from "react";
import { toast } from "react-toastify";

import Form from "./common/form";

import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import Invoice from "./reports/invoice";

import { getCustomer } from "../services/customerService";
import { getProduct } from "../services/productService";
import { getEnrollment } from "../services/enrollmentService";

class EnrollmentPrintInvoice extends Form {
  // Stores the three records required to build the invoice.
  // The enrollmentId itself is received through React Router location.state.
  state = {
    enrollment: null,
    student: null,
    product: null,
    invoiceError: "",
  };

  // Loads all data required by the invoice when the print page first opens.
  async componentDidMount() {
    await this.populateInvoiceData();
  }

  // Retrieves the enrollment using the enrollmentId passed by the source page,
  // then retrieves the related customer and product records in parallel.
  async populateInvoiceData() {
    try {
      const locationState = this.props.location.state || {};
      const enrollmentId = locationState.enrollmentId;

      // Prevents the page from attempting API requests without an enrollment ID.
      if (!enrollmentId) {
        this.setState({
          invoiceError: "Missing enrollment ID.",
        });

        toast.error("Missing enrollment ID.");
        return;
      }

      // Retrieves the enrollment associated with the selected payment/enrollment.
      const { data: enrollment } = await getEnrollment(enrollmentId);

      // Uses the customer and product IDs embedded in the enrollment
      // to retrieve their complete current records.
      const [{ data: student }, { data: product }] = await Promise.all([
        getCustomer(enrollment.customer._id),
        getProduct(enrollment.product._id),
      ]);

      // Stores all three records required by render() to build the invoice PDF.
      this.setState({
        enrollment,
        student,
        product,
        invoiceError: "",
      });
    } catch (ex) {
      console.error("Unable to load invoice data:", ex);

      const errorMessage =
        ex.response && ex.response.data
          ? ex.response.data
          : "Unable to load invoice data.";

      this.setState({
        invoiceError: errorMessage,
      });

      toast.error(errorMessage);
    }
  }

  render() {
    const {
      enrollment,
      student,
      product,
      invoiceError,
    } = this.state;

    // Displays a local error instead of leaving the page permanently loading.
    if (invoiceError) {
      return <span>{invoiceError}</span>;
    }

    // Wait until the enrollment, customer, and product data have all loaded.
    if (!enrollment || !student || !product) {
      return <span>Loading Invoice Data ....</span>;
    }

    // Formats the enrollment date for display on the invoice.
    const enrollmentDate = new Date(
      enrollment.enrollmentDate
    ).toLocaleDateString("en-ZA");

    // Formats the course/product end date for use as the invoice due date.
    const endDate = new Date(
      enrollment.product.endDate
    ).toLocaleDateString("en-ZA");

    // Converts the MongoDB Decimal128 course price into its display value.
    const productPrice =
      enrollment.product.productPrice.$numberDecimal;

    // Recreates the invoice number using the enrollment date,
    // matching the logic previously used by completionForm.jsx.
    const invoiceNo =
      new Date(enrollment.enrollmentDate).getTime();

    // Builds the object expected by the reusable Invoice PDF component.
    const invoiceData = {
      id: enrollment._id,
      invoice_no: invoiceNo,
      balance: productPrice,
      company: student.name,
      email: student.email ? student.email : "Missing Email",
      phone: student.phone,
      address: student.address
        ? student.address
        : "Missing Address",
      trans_date: enrollmentDate,
      due_date: endDate,
      items: [
        {
          sno: 1,
          desc:
            product.productCode +
            " - " +
            enrollment.product.name,
          qty: 1,
          rate: productPrice,
        },
      ],
    };

    return (
      <div className="App">
        {/* Displays the generated invoice PDF in the browser. */}
        <div>
          <PDFViewer width={800} height={1100}>
            <Invoice invoice={invoiceData} />
          </PDFViewer>
        </div>

        <div className="text-center border-top">
          {/* Allows the currently displayed invoice PDF to be downloaded. */}
          <PDFDownloadLink
            className="btn btn-primary mt-2 mr-2"
            document={<Invoice invoice={invoiceData} />}
            fileName="document.pdf"
          >
            {({ blob, url, loading, error }) =>
              loading ? "Loading document..." : "Download"
            }
          </PDFDownloadLink>

          {this.renderLink("/enrollments", "Exit")}
        </div>
      </div>
    );
  }
}

export default EnrollmentPrintInvoice;