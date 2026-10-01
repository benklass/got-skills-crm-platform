import React, { Component } from "react";
import auth from "../services/authService";
import { Link } from "react-router-dom";
import Table from "./common/table";

class CustomerTable extends Component {
  columns = [
    {
      path: "customer",
      label: "Name",
      content: (customer) => (
        <Link
          to={`/customers/${customer._id}`}
          className="col-12 font-weight-bold btn btn-sm btn-info"
        >
          {customer.name}
        </Link>
      ),
    },
    { path: "phone", label: "Phone" },
    { path: "grade", label: "Grade" },
    { path: "email", label: "Email" },
  ];

  deleteColumn = {
    key: "delete",
    content: (customer) => (
      <button
        onClick={() => this.props.onDelete(customer)}
        className="btn btn-danger btn-sm"
      >
        Delete
      </button>
    ),
  };

  constructor() {
    super();
    const user = auth.getCurrentUser();
    if (user && user.isAdmin) this.columns.push(this.deleteColumn);
  }

  render() {
    const { customers, onSort, sortColumn } = this.props;
    return (
      <Table
        columns={this.columns}
        data={customers}
        sortColumn={sortColumn}
        onSort={onSort}
      />
    );
  }
}

export default CustomerTable;
