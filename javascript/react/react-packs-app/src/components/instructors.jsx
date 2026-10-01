import React, { Component } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import InstructorsTable from "./instructorsTable";

import Pagination from "./common/pagination";
import {
  deleteInstructor,
  getInstructors,
} from "../services/instructorService";

import { paginate } from "../utils/paginate";
import SearchBox from "./searchBox";
import _ from "lodash";

class Instructors extends Component {
  state = {
    instructors: [],
    currentPage: 1,
    pageSize: 6,
    sortColumn: { path: "name", order: "asc" },
  };

  async componentDidMount() {
    const { data: instructors } = await getInstructors();
    this.setState({ instructors });
  }

  handleDelete = async (instructor) => {
    const orginalInstructors = this.state.instructors;
    const instructors = orginalInstructors.filter(
      (i) => i._id !== instructor._id
    );

    this.setState({ instructors });

    try {
      await deleteInstructor(instructor._id);
    } catch (ex) {
      // DA 01 03 2023 Add error 400 if Instructor has enrollment cannot remove.
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

      this.setState({ instructors: orginalInstructors });
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
      instructors: allInstructors,
      searchQuery,
    } = this.state;

    let filtered = allInstructors;
    if (searchQuery)
      filtered = allInstructors.filter((i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const sorted = _.orderBy(filtered, [sortColumn.path], [sortColumn.order]);

    const instructors = paginate(sorted, currentPage, pageSize);

    return { totalCount: filtered.length, data: instructors };
  };

  // DA 08 03 2023 Added this the renderLink is used in two places
  renderLink() {
    return (
      <Link
        to="/instructors/new"
        className="btn btn-success btn-sm border"
        style={{ marginBottom: 20 }}
      >
        Add Instructor
      </Link>
    );
  }

  render() {
    const { length: count } = this.state.instructors;
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
              aria-valuenow="65"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              Loading list of students.........
            </div>
          </div>
        </div>
      );

    const { totalCount, data: instructors } = this.getPagedData();

    return (
      <div className="row">
        <div className="col">
          <SearchBox value={searchQuery} onChange={this.handleSearch} />

          {user && this.renderLink()}

          <InstructorsTable
            instructors={instructors}
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
          <p>{totalCount} intructors registered.</p>
        </div>
      </div>
    );
  }
}

export default Instructors;
