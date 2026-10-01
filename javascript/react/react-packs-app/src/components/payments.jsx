import React, { Component } from "react";
import { Link } from "react-router-dom";

// import EnrollmentTable from "./enrollmentsTable";

import PaymentsTable from "./paymentsTable";
import Pagination from "./common/pagination";

import { getPayments } from "../services/paymentService";

import { paginate } from "../utils/paginate";
import SearchBox from "./searchBox";
import _ from "lodash";

class Payments extends Component {
  state = {
    payments: [],
    enrollments: [],
    currentPage: 1,
    pageSize: 6,
    sortColumn: { path: "name", order: "asc" },
    paymentListExecuted: false,
  };

  async componentDidMount() {
    if (this.props.location.pathname === "/payments") {
      const { data } = await getPayments();
      const returnedData = data;
      await this.handlePaymentsList(returnedData);
    }
  }

  async componentDidUpdate() {
    if (this.props.location.pathname === "/payments") {
      if (!this.state.paymentListExecuted) {
        const { data } = await getPayments();
        const returnedData = data;
        await this.handlePaymentsList(returnedData);

        this.setState({
          currentPage: 1,
          paymentListExecuted: true,
        });
      }
    }
  }

  async handlePaymentsList(returnedData) {
    // Data used to display in the payment table
    const payments = returnedData.map((payment) => {
      const {
        _id,
        name,
        enrollmentId,
        customerId,
        productCode,
        productInvoice,
        productDescription,
        grossAmount,
        netAmount,
        feeAmount,
        transactionDate,
        isFullPayment,
        spTransactionId,
        paymentMethod,
        serviceProvider,
      } = payment;
      const formatTransactionDate = new Date(transactionDate);
      const mPaymentIdTimestamp = parseInt(
        enrollmentId.toString().substr(0, 10),
        16
      );

      return {
        _id,
        enrollmentId,
        customerId,
        name,
        productCode,
        productDescription,
        productInvoice,
        transactionDate: formatTransactionDate.toLocaleDateString("en-ZA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        grossAmount: grossAmount ? Math.round(grossAmount.$numberDecimal) : "",
        netAmount: netAmount ? Math.round(netAmount.$numberDecimal) : "",
        feeAmount: feeAmount ? Math.round(netAmount.$numberDecimal) : "",
        spTransactionId,
        paymentMethod,
        serviceProvider,
        isFullPayment: isFullPayment ? "Yes" : "No",
        mPaymentIdTimestamp,
      };
    });

    this.setState({
      payments,
    });
  }

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  handleSearch = (query) => {
    this.setState({ searchQuery: query, currentPage: 1 });
  };

  handleSort = (sortColumn) => {
    this.setState({ sortColumn });
  };

  getPagedData = () => {
    const {
      pageSize,
      currentPage,
      sortColumn,
      payments: allPayments,
      searchQuery,
    } = this.state;

    let filtered = allPayments;
    if (searchQuery)
      filtered = allPayments.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const sorted = _.orderBy(filtered, [sortColumn.path], [sortColumn.order]);
    const payments = paginate(sorted, currentPage, pageSize);

    return { totalCount: filtered.length, data: payments };
  };

  // DA 08 03 2023 Added this the renderLink is used in two places
  renderLink() {
    return (
      <div>
        <b
          className="btn btn-sm text-bold"
          style={{ marginBottom: 20, marginRight: 10 }}
        >
          ADD Payments :
        </b>
        <Link
          to="/enrollments/_enrolledNotCompletedNotPaid"
          className="btn btn-success btn-sm border"
          style={{ marginBottom: 20, marginRight: 10 }}
        >
          Enrolled Unpaid
        </Link>
        <Link
          to="/enrollments/_completedNotPaid"
          className="btn btn-success btn-sm border"
          style={{ marginBottom: 20, marginRight: 10 }}
        >
          Done Unpaid
        </Link>
      </div>
    );
  }

  render() {
    console.log("here in payments.jsx - render : ", this.state.payments);
    const { length: count } = this.state.payments;
    const { pageSize, currentPage, sortColumn, searchQuery } = this.state;
    const { user } = this.props; // Use user elements to control access to functionality

    if (count === 0)
      return (
        <div className="row  no-gutters">
          <div className="col">{user && this.renderLink()}</div>

          <div className="progress">
            <div
              className="progress-bar bg-info"
              role="progressbar"
              aria-valuenow="80"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              Loading list of payments .........
            </div>
          </div>
        </div>
      );

    const { totalCount, data: payments } = this.getPagedData();

    return (
      <div className="row">
        <div className="col">
          <SearchBox value={searchQuery} onChange={this.handleSearch} />

          {user && this.renderLink()}
          <PaymentsTable
            payments={payments}
            sortColumn={sortColumn}
            onChange={this.handleReturn}
            onSort={this.handleSort}
          />
          <Pagination
            itemsCount={totalCount}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={this.handlePageChange}
          />
          <p>{totalCount} payments in list.</p>
        </div>
      </div>
    );
  }
}

export default Payments;
