import React, { Component } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import ProductsTable from "./productsTable";

import ListGroup from "./common/listGroup";
import Pagination from "./common/pagination";

import { deleteProduct, getProducts } from "../services/productService";

import { getInstructors } from "../services/instructorService";

import { paginate } from "../utils/paginate";
import SearchBox from "./searchBox";
import _ from "lodash";

class Products extends Component {
  state = {
    products: [],
    instructors: [],
    searchQuery: "",
    selectedInstructor: null,
    currentPage: 1,
    pageSize: 6,
    sortColumn: { path: "name", order: "asc" },
  };

  async componentDidMount() {
    const { data } = await getInstructors();
    const instructors = [{ _id: "", name: "All Instructors" }, ...data];

    const { data: products } = await getProducts();

    // DA 10 03 2023 Bug fix to map 1 level array for object data to use the tables module to display data see table.jsx
    const updatedProducts = await products
      .filter((product) => product.numberInStock >= 1)
      .map((product) => {
        const startDate = new Date(product.startDate);
        const endDate = new Date(product.endDate);
        return {
          ...product,
          startDate: startDate.toLocaleDateString("en-ZA"),
          endDate: endDate.toLocaleDateString("en-ZA"),
          instructorId: product.instructor._id,
          instructor: product.instructor.name,
          productPrice: product.productPrice.$numberDecimal,
        };
      });

    this.setState({ products: updatedProducts, instructors: instructors });
  }

  handleDelete = async (product) => {
    const orginalProducts = this.state.products;
    const products = orginalProducts.filter((p) => p._id !== product._id);

    this.setState({ products });

    try {
      await deleteProduct(product._id);
    } catch (ex) {
      if (ex.response)
        switch (ex.response.status) {
          // DA 02 03 2023  Added error 400 if product has rental then cannot delete until returned
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

      this.setState({ products: orginalProducts });
    }
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  handleInstructorSelect = (instructor) => {
    this.setState({
      selectedInstructor: instructor,
      currentPage: 1,
      searchQuery: "",
    });
  };

  handleSearch = (query) => {
    this.setState({
      searchQuery: query,
      selectedInstructor: null,
      currentPage: 1,
    });
  };

  handleSort = (sortColumn) => {
    this.setState({ sortColumn });
  };

  handleNewProduct = () => {
    window.location.replace("./products/new");
  };

  getPagedData = () => {
    const {
      pageSize,
      currentPage,
      sortColumn,
      products: allProducts,
      selectedInstructor,
      searchQuery,
    } = this.state;

    let filtered = allProducts;

    if (searchQuery)
      filtered = allProducts.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    else if (selectedInstructor && selectedInstructor._id)
      filtered = allProducts.filter(
        (p) => p.instructorId === selectedInstructor._id
      );

    const sorted = _.orderBy(filtered, [sortColumn.path], [sortColumn.order]);

    const products = paginate(sorted, currentPage, pageSize);

    return { totalCount: filtered.length, data: products };
  };

  // DA 08 03 2023 Added this the renderLink is used in two places
  renderLink() {
    return (
      <Link
        to="/products/new"
        className="btn btn-success btn-sm border"
        style={{ marginBottom: 20 }}
      >
        Add Course
      </Link>
    );
  }

  render() {
    const { length: count } = this.state.products;
    const { pageSize, currentPage, sortColumn, searchQuery } = this.state;
    const { user } = this.props; // Use use elements to control access to functionality

    if (count === 0)
      return (
        <div className="row">
          <div className="col">{user && this.renderLink()}</div>
          <div className="progress">
            <div
              className="progress-bar bg-info"
              role="progressbar"
              aria-valuenow="50"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              Loading list of courses .........
            </div>
          </div>
        </div>
      );

    const { totalCount, data: products } = this.getPagedData();

    return (
      <div className="row">
        <div className="d-flex flex-column">
          <ListGroup
            items={this.state.instructors}
            selectedItem={this.state.selectedInstructor}
            onItemSelect={this.handleInstructorSelect}
          />
        </div>
        <div className="col">
          <SearchBox value={searchQuery} onChange={this.handleSearch} />
          {user && this.renderLink()}

          <ProductsTable
            products={products}
            sortColumn={sortColumn}
            onLike={this.handleLike}
            onDelete={this.handleDelete}
            onSort={this.handleSort}
          />
          <Pagination
            itemsCount={totalCount}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={this.handlePageChange}
          />
          <p>{totalCount} Courses available.</p>
        </div>
      </div>
    );
  }
}

export default Products;
