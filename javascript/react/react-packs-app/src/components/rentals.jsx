import React, { Component } from "react";
import { Link } from "react-router-dom";

import RentalsTable from "./rentalsTable";

import Pagination from "./common/pagination";
import { getRentals } from "../services/rentalService";

import { paginate } from "../utils/paginate";
import SearchBox from "./searchBox";
import _ from "lodash";

class Rentals extends Component {
  state = {
    rentals: [],
    currentPage: 1,
    pageSize: 6,
    sortColumn: { path: "name", order: "asc" },
  };

  async componentDidMount() {
    const { data } = await getRentals();
    // Data used to display on the rentals table
    const rentals = data.map((rental) => {
      const { _id, customer, movie, dateOut, dateReturned } = rental;
      return {
        _id: _id,
        customerId: customer._id,
        name: customer.name,
        isGold: customer.isGold,
        movieId: movie._id,
        title: movie.title,
        dailyRentalRate: movie.dailyRentalRate,
        dateOut,
        dateReturned,
      };
    });

    this.setState({
      rentals,
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
      rentals: allRentals,
      searchQuery,
    } = this.state;

    let filtered = allRentals;
    if (searchQuery)
      filtered = allRentals.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const sorted = _.orderBy(filtered, [sortColumn.path], [sortColumn.order]);
    const rentals = paginate(sorted, currentPage, pageSize);

    return { totalCount: filtered.length, data: rentals };
  };

  // DA 08 03 2023 Added this the renderLink is used in two places
  renderLink() {
    return (
      <Link
        to="/rentals/new"
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: 20 }}
      >
        Add Check Out
      </Link>
    );
  }

  render() {
    const { length: count } = this.state.rentals;
    const { pageSize, currentPage, sortColumn, searchQuery } = this.state;
    const { user } = this.props; // Use user elements to control access to functionality

    if (count === 0)
      return (
        <div className="row">
          <div className="col">{user && this.renderLink()}</div>

          <div className="progress">
            <div
              className="progress-bar bg-info"
              role="progressbar"
              aria-valuenow="80"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              Loading list of checked out .........
            </div>
          </div>
        </div>
      );

    const { totalCount, data: rentals } = this.getPagedData();

    return (
      <div className="row">
        <div className="col">
          {user && this.renderLink()}
          <p>Showing {totalCount} check outs in the database.</p>
          <SearchBox value={searchQuery} onChange={this.handleSearch} />
          <RentalsTable
            rentals={rentals}
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
        </div>
      </div>
    );
  }
}

export default Rentals;
