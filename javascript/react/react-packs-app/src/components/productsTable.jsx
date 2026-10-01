import React, { Component } from "react";
import auth from "../services/authService";
import { Link } from "react-router-dom";
import Table from "./common/table";

class ProductsTable extends Component {
  columns = [
    {
      path: "name",
      label: "Course",
      content: (product) => (
        <Link
          to={`/products/${product._id}`}
          className="col-12 font-weight-bold btn btn-sm btn-info"
          data-toggle="tooltip"
          data-placement="left"
          title={product.description}
        >
          {product.name}
        </Link>
      ),
    },
    { path: "instructor", label: "Instructor" },
    { path: "numberInStock", label: "Slots" },
    { path: "productPrice", label: "Fee R." },
    { path: "startDate", label: "Start Date" },
    { path: "endDate", label: "End Date" },
  ];

  deleteColumn = {
    key: "delete",
    content: (product) => (
      <button
        onClick={() => this.props.onDelete(product)}
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
    const { products, onSort, sortColumn } = this.props;
    return (
      <Table
        columns={this.columns}
        data={products}
        sortColumn={sortColumn}
        onSort={onSort}
      />
    );
  }
}

export default ProductsTable;
