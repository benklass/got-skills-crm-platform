import React, { Component } from "react";
import auth from "../services/authService";
import { Link } from "react-router-dom";
import Table from "./common/table";

class UserTable extends Component {
  columns = [
    { path: "name", label: "Full Name" },
    {
      path: "email",
      label: "Login",
      content: (user) => (
        <Link
          to={`/users/${user._id}`}
          className="col-12 font-weight-bold btn btn-sm btn-info"
          data-toggle="tooltip"
          data-placement="left"
          title="Modify User"
        >
          {user.email}
        </Link>
      ),
    },
    { path: "isAdmin", label: "Admin" },
    { path: "isInstructor", label: "Instructor" },
    { path: "isStudent", label: "Student" },
    { path: "isParent", label: "Parent" },
  ];

  deleteColumn = {
    key: "delete",
    content: (user) => (
      <button
        onClick={() => this.props.onDelete(user)}
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
    const { users, onSort, sortColumn } = this.props;
    return (
      <div className="container-fluid">
        <Table
          columns={this.columns}
          data={users}
          sortColumn={sortColumn}
          onSort={onSort}
        />
      </div>
    );
  }
}

export default UserTable;
