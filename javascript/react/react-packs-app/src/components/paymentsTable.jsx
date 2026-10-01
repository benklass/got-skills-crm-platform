import React, { Component } from "react";
import { Link } from "react-router-dom";
import Table from "./common/table";

class PaymentsTable extends Component {
  // Defines the columns displayed in the Payments table.
  // Columns with a "path" are data columns and can be sorted.
  // Action columns use a "key" and sortable: false.
  columns = [
    { path: "transactionDate", label: "Date/Time" },

    {
      path: "productInvoice",
      label: "Invoice",
      content: (payment) => (
        <Link
          to={`/enrollments/${payment.enrollmentId}`}
          className="col-12 font-weight-bold btn btn-sm btn-info"
          data-toggle="tooltip"
          data-placement="left"
          title={"View Invoice Details for " + payment.productDescription}
        >
          {payment.productInvoice}
        </Link>
      ),
    },

    { path: "mPaymentIdTimestamp", label: "Transaction" },

    { path: "grossAmount", label: "Total R." },

    {
      path: "name",
      label: "Student",
      content: (payment) => (
        <Link
          to={`/customers/${payment.customerId}`}
          className="col-12 font-weight-bold btn btn-sm btn-info"
          data-toggle="tooltip"
          data-placement="left"
          title="View Student"
        >
          {payment.name}
        </Link>
      ),
    },

    {
      // Use productCode as the sort path because this is the actual
      // Payment property displayed in the Course column.
      path: "productCode",
      label: "Course",
      content: (payment) => (
        <Link
          to={`/enrollments/${payment.enrollmentId}`}
          className="col-12 font-weight-bold btn btn-sm btn-info"
          data-toggle="tooltip"
          data-placement="left"
          title={payment.productDescription}
        >
          {payment.productCode}
        </Link>
      ),
    },

    { path: "serviceProvider", label: "GW" },

    { path: "spTransactionId", label: "GW Transaction" },

    { path: "isFullPayment", label: "Full Paid" },

    // Opens the existing invoice PDF page for the enrollment associated
    // with this payment. Only the enrollmentId is passed to the page;
    // enrollmentPrint.jsx is responsible for loading the required data.
    {
      key: "downloadInvoice",
      label: "Download Invoice",
      sortable: false,
      content: (payment) => (
        <Link
          className="font-weight-bold btn btn-sm btn-success"
          to={{
            pathname: "/enrollmentPrint",
            state: {
              enrollmentId: payment.enrollmentId,
            },
          }}
        >
          Download Invoice
        </Link>
      ),
    },

    // Opens the existing receipt PDF page for this specific payment.
    // paymentId is used so the receipt page can retrieve the exact
    // Payment record represented by this table row.
    {
      key: "downloadReceipt",
      label: "Download Receipt",
      sortable: false,
      content: (payment) => (
        <Link
          className="font-weight-bold btn btn-sm btn-success"
          to={{
            pathname: "/receiptPrint",
            state: {
              paymentId: payment._id,
            },
          }}
        >
          Download Receipt
        </Link>
      ),
    },
  ];

  render() {
    // Payments and sorting state/handlers are managed by the parent
    // Payments component and passed through to the reusable Table.
    const { payments, onSort, sortColumn } = this.props;

    return (
      <Table
        columns={this.columns}
        data={payments}
        sortColumn={sortColumn}
        onSort={onSort}
      />
    );
  }
}

export default PaymentsTable;