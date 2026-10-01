import React, { Component } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import CustomersTable from "./customersTable";

import Pagination from "./common/pagination";
import { deleteCustomer, getCustomers } from "../services/customerService";

import { paginate } from "../utils/paginate";
import SearchBox from "./searchBox";
import _ from "lodash";

class Customers extends Component {
  state = {
    customers: [],
    currentPage: 1,
    pageSize: 6,
    sortColumn: { path: "name", order: "asc" },
  };

  async componentDidMount() {
    const { data: customers } = await getCustomers();
    this.setState({ customers });
  }

  handleDelete = async (customer) => {
    const orginalCustomers = this.state.customers;
    const customers = orginalCustomers.filter((c) => c._id !== customer._id);

    this.setState({ customers });

    try {
      await deleteCustomer(customer._id);
    } catch (ex) {
      // DA 01 03 2023 Add error 400 if Customer has enrollment cannot remove customer.
      if (ex.response)
        switch (ex.response.status) {
          case 400:
            toast.error(ex.response.data);
            break;
          case 404:
            toast.error(ex.response.data);
            break;
          case 403:
            toast.error(ex.response.data);
            break;
          case 401:
            toast.error(ex.response.data);
            break;
          default:
            toast.error("A Unspecified Error occured.", ex.response.data);
        }

      this.setState({ customers: orginalCustomers });
    }
  };

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
      customers: allCustomers,
      searchQuery,
    } = this.state;

    let filtered = allCustomers;
    if (searchQuery)
      filtered = allCustomers.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const sorted = _.orderBy(filtered, [sortColumn.path], [sortColumn.order]);

    const customers = paginate(sorted, currentPage, pageSize);

    return { totalCount: filtered.length, data: customers };
  };

  render() {
    const { length: count } = this.state.customers;
    const { pageSize, currentPage, sortColumn, searchQuery } = this.state;
    const { user } = this.props; // Use use elements to control access to functionality

    if (count === 0)
      return (
        <div className="progress">
          <div
            className="progress-bar bg-info"
            role="progressbar"
            aria-valuenow="65"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            Loading list of students.........
          </div>
        </div>
      );

    const { totalCount, data: customers } = this.getPagedData();

    return (
      <div className="row">
        <div className="col">
          <SearchBox value={searchQuery} onChange={this.handleSearch} />

          {user && (
            <Link
              to="/customers/new"
              className="btn btn-success btn-sm border"
              style={{ marginBottom: 20 }}
            >
              Add Student
            </Link>
          )}

          <CustomersTable
            customers={customers}
            sortColumn={sortColumn}
            onDelete={this.handleDelete}
            onSort={this.handleSort}
          />
          <Pagination
            itemsCount={totalCount}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={this.handlePageChange}
          />
          <p>{totalCount} students registered.</p>
        </div>
      </div>
    );
  }
}

export default Customers;
