import React, { Component } from "react";
import { Link } from "react-router-dom";

import EnrollmentTable from "./enrollmentsTable";

import Pagination from "./common/pagination";

import {
  getEnrollments,
  getAllPaidNotPaidEnrollments,
  getCompletedPaidEnrollments,
  getCompletedNotPaidEnrollments,
  getPaidEnrollments,
  getEnrolledNotCompletedNotPaid,
} from "../services/enrollmentService";

import { paginate } from "../utils/paginate";
import SearchBox from "./searchBox";
import _ from "lodash";

class Enrollments extends Component {
  state = {
    enrollments: [],
    currentPage: 1,
    pageSize: 6,
    sortColumn: { path: "name", order: "asc" },
    enrollmentListExecuted: false,
    AllEnrollmentListExecuted: false,
    CompletedPaidEnrollmentListExecuted: false,
    CompletedNotPaidEnrollmentListExecuted: false,
    EnrollmentsPaidExecuted: false,
    EnrolledNotCompletedNotPaidExecuted: false,
  };

  async componentDidMount() {
    if (this.props.location.pathname === "/enrollments") {
      const { data } = await getEnrollments();
      const returnedData = data;
      await this.handleEnrollmentsList(returnedData);
    } else if (
      this.props.location.pathname ===
      "/enrollments/_enrolledNotCompletedNotPaid"
    ) {
      const { data } = await getEnrolledNotCompletedNotPaid();
      const returnedData = data;
      await this.handleEnrollmentsList(returnedData);
    } else if (
      this.props.location.pathname === "/enrollments/_completedNotPaid"
    ) {
      const { data } = await getCompletedNotPaidEnrollments();
      const returnedData = data;
      await this.handleEnrollmentsList(returnedData);
    }
  }

  async componentDidUpdate() {
    if (this.props.location.pathname === "/enrollments") {
      if (!this.state.enrollmentListExecuted) {
        const { data } = await getEnrollments();
        const returnedData = data;
        await this.handleEnrollmentsList(returnedData);

        this.setState({
          currentPage: 1,
          EnrollmentsPaidExecuted: false,
          CompletedNotPaidEnrollmentListExecuted: false,
          CompletedPaidEnrollmentListExecuted: false,
          AllEnrollmentListExecuted: false,
          enrollmentListExecuted: true,
          EnrolledNotCompletedNotPaidExecuted: false,
        });
      }
    } else if (this.props.location.pathname === "/enrollments/_all") {
      if (!this.state.AllEnrollmentListExecuted) {
        const { data } = await getAllPaidNotPaidEnrollments();
        const returnedData = data;
        await this.handleEnrollmentsList(returnedData);

        this.setState({
          currentPage: 1,
          EnrollmentsPaidExecuted: false,
          CompletedNotPaidEnrollmentListExecuted: false,
          CompletedPaidEnrollmentListExecuted: false,
          AllEnrollmentListExecuted: true,
          enrollmentListExecuted: false,
          EnrolledNotCompletedNotPaidExecuted: false,
        });
      }
    } else if (this.props.location.pathname === "/enrollments/_completedPaid") {
      if (!this.state.CompletedPaidEnrollmentListExecuted) {
        const { data } = await getCompletedPaidEnrollments();
        const returnedData = data;
        await this.handleEnrollmentsList(returnedData);

        this.setState({
          currentPage: 1,
          EnrollmentsPaidExecuted: false,
          CompletedNotPaidEnrollmentListExecuted: false,
          CompletedPaidEnrollmentListExecuted: true,
          AllEnrollmentListExecuted: false,
          enrollmentListExecuted: false,
          EnrolledNotCompletedNotPaidExecuted: false,
        });
      }
    } else if (
      this.props.location.pathname === "/enrollments/_completedNotPaid"
    ) {
      if (!this.state.CompletedNotPaidEnrollmentListExecuted) {
        const { data } = await getCompletedNotPaidEnrollments();
        const returnedData = data;
        await this.handleEnrollmentsList(returnedData);

        this.setState({
          currentPage: 1,
          EnrollmentsPaidExecuted: false,
          CompletedNotPaidEnrollmentListExecuted: true,
          CompletedPaidEnrollmentListExecuted: false,
          AllEnrollmentListExecuted: false,
          enrollmentListExecuted: false,
          EnrolledNotCompletedNotPaidExecuted: false,
        });
      }
    } else if (
      this.props.location.pathname === "/enrollments/_enrollmentsPaid"
    ) {
      if (!this.state.EnrollmentsPaidExecuted) {
        const { data } = await getPaidEnrollments();
        const returnedData = data;
        await this.handleEnrollmentsList(returnedData);

        this.setState({
          currentPage: 1,
          EnrollmentsPaidExecuted: true,
          CompletedNotPaidEnrollmentListExecuted: false,
          CompletedPaidEnrollmentListExecuted: false,
          AllEnrollmentListExecuted: false,
          enrollmentListExecuted: false,
          EnrolledNotCompletedNotPaidExecuted: false,
        });
      }
    } else if (
      this.props.location.pathname ===
      "/enrollments/_enrolledNotCompletedNotPaid"
    ) {
      if (!this.state.EnrolledNotCompletedNotPaidExecuted) {
        const { data } = await getEnrolledNotCompletedNotPaid();
        const returnedData = data;
        await this.handleEnrollmentsList(returnedData);

        this.setState({
          currentPage: 1,
          EnrollmentsPaidExecuted: false,
          CompletedNotPaidEnrollmentListExecuted: false,
          CompletedPaidEnrollmentListExecuted: false,
          AllEnrollmentListExecuted: false,
          enrollmentListExecuted: false,
          EnrolledNotCompletedNotPaidExecuted: true,
        });
      }
    }
  }

  async handleEnrollmentsList(returnedData) {
    // Data used to display in the enrollments table
    const enrollments = returnedData.map((enrollment) => {
      const {
        _id,
        customer,
        product,
        enrollmentDate,
        enrollmentFee,
        enrollmentPaid,
        completionDate,
      } = enrollment;
      const startDate = new Date(product.startDate);
      const endDate = new Date(product.endDate);
      const formatEnrollmentDate = new Date(enrollmentDate);
      const formatCompletionDate = completionDate
        ? new Date(completionDate).toLocaleDateString("en-ZA")
        : null;
      return {
        _id: _id,
        customerId: customer._id,
        name: customer.name,
        productId: product._id,
        product: product.name,
        startDate: startDate.toLocaleDateString("en-ZA"),
        endDate: endDate.toLocaleDateString("en-ZA"),
        productPrice: Math.round(product.productPrice.$numberDecimal),
        enrollmentDate: formatEnrollmentDate.toLocaleDateString("en-ZA"),
        enrollmentFee: enrollmentFee
          ? Math.round(enrollmentFee.$numberDecimal)
          : "",
        completionDate: formatCompletionDate ? formatCompletionDate : "busy",
        enrollmentPaid: enrollmentPaid ? "Yes" : "No",
      };
    });

    this.setState({
      enrollments,
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
      enrollments: allEnrollments,
      searchQuery,
    } = this.state;

    let filtered = allEnrollments;
    if (searchQuery)
      filtered = allEnrollments.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const sorted = _.orderBy(filtered, [sortColumn.path], [sortColumn.order]);
    const enrollments = paginate(sorted, currentPage, pageSize);

    return { totalCount: filtered.length, data: enrollments };
  };

  // DA 08 03 2023 Added this the renderLink is used in two places
  renderLink() {
    return (
      <div>
        <Link
          to="/enrollments/new"
          className="btn btn-success btn-sm border"
          style={{ marginBottom: 20, marginRight: 10 }}
        >
          Add Enrollment
        </Link>
        <b className="btn btn-sm" style={{ marginBottom: 20, marginRight: 10 }}>
          LISTS :
        </b>
        <Link
          to="/enrollments"
          className="btn btn-secondary btn-sm border"
          style={{ marginBottom: 20, marginRight: 10 }}
        >
          Active
        </Link>
        <Link
          to="/enrollments/_enrolledNotCompletedNotPaid"
          className="nav-item btn btn-secondary btn-sm border"
          style={{ marginBottom: 20, marginRight: 10 }}
        >
          Active Unpaid
        </Link>
        <Link
          to="/enrollments/_enrollmentsPaid"
          className="btn btn-secondary btn-sm border"
          style={{ marginBottom: 20, marginRight: 10 }}
        >
          Paid
        </Link>

        <Link
          to="/enrollments/_completedNotPaid"
          className="btn btn-secondary btn-sm border"
          style={{ marginBottom: 20, marginRight: 10 }}
        >
          Done Unpaid
        </Link>

        <Link
          to="/enrollments/_completedPaid"
          className="btn btn-secondary btn-sm border"
          style={{ marginBottom: 20, marginRight: 10 }}
        >
          Done Paid
        </Link>
        <Link
          to="/enrollments/_all"
          className="btn btn-secondary btn-sm border"
          style={{ marginBottom: 20, marginRight: 10 }}
        >
          All Enrollments
        </Link>
      </div>
    );
  }

  render() {
    const { length: count } = this.state.enrollments;
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
              Loading list of enrollments .........
            </div>
          </div>
        </div>
      );

    const { totalCount, data: enrollments } = this.getPagedData();

    return (
      <div className="row">
        <div className="col">
          <SearchBox value={searchQuery} onChange={this.handleSearch} />

          {user && this.renderLink()}
          <EnrollmentTable
            enrollments={enrollments}
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
          <p>{totalCount} enrollments of selected type in list.</p>
        </div>
      </div>
    );
  }
}

export default Enrollments;
