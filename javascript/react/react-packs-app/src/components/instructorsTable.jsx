import React, { Component } from "react";
import auth from "../services/authService";
import { Link } from "react-router-dom";
import Table from "./common/table";

class InstructorTable extends Component {
  columns = [
    {
      path: "instructor",
      label: "Name",
      content: (instructor) => (
        <Link
          to={`/instructors/${instructor._id}`}
          className="col-12 font-weight-bold btn btn-sm btn-info"
        >
          {instructor.name}
        </Link>
      ),
    },
    { path: "phone", label: "Phone" },
    { path: "email", label: "Email" },
    { path: "address", label: "Address" },
  ];

  deleteColumn = {
    key: "delete",
    content: (instructor) => (
      <button
        onClick={() => this.props.onDelete(instructor)}
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
    const { instructors, onSort, sortColumn } = this.props;
    return (
      <Table
        columns={this.columns}
        data={instructors}
        sortColumn={sortColumn}
        onSort={onSort}
      />
    );
  }
}

export default InstructorTable;
