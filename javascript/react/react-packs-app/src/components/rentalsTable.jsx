import React, { Component } from "react";
import auth from "../services/authService";
import { Link } from "react-router-dom";
import Table from "./common/table";

class RentalTable extends Component {
  columns = [
    {
      path: "name",
      label: "Customer",
      content: (rental) => (
        <Link
          to={`/customers/${rental.customerId}`}
          className="col-12 font-weight-bold btn btn-sm btn-info"
        >
          {rental.name}
        </Link>
      ),
    },
    {
      path: "title",
      label: "Title",
      content: (rental) => (
        <Link
          to={`/movies/${rental.movieId}`}
          className="col-12 font-weight-bold btn btn-sm btn-info"
        >
          {rental.title}
        </Link>
      ),
    },
    { path: "isGold", label: "Is Gold" },
    { path: "dailyRentalRate", label: "Daily Rate" },
    { path: "dateOut", label: "Checked Out" },
  ];

  rentalColumn = {
    key: "rental",
    content: (rental) => (
      <Link
        to={`/rentals/${rental._id}`}
        className="font-weight-bold btn btn-sm btn-secondary"
      >
        Return
      </Link>
    ),
  };

  // DA Changed this to control the access for the delete.  Need to add isEditor
  constructor() {
    super();
    const user = auth.getCurrentUser();
    //if (user && user.isAdmin) this.columns.push(this.rentalColumn);
    if (user) this.columns.push(this.rentalColumn);
  }

  render() {
    const { rentals, onSort, sortColumn } = this.props;
    return (
      <Table
        columns={this.columns}
        data={rentals}
        sortColumn={sortColumn}
        onSort={onSort}
      />
    );
  }
}

export default RentalTable;
