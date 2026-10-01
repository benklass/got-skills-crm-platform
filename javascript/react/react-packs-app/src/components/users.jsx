import React, { Component } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import UsersTable from "./usersTable";

import Pagination from "./common/pagination";
import { deleteUser, getUsers } from "../services/userService";

import { paginate } from "../utils/paginate";
import SearchBox from "./searchBox";
import _ from "lodash";

class Users extends Component {
  state = {
    users: [],
    currentPage: 1,
    pageSize: 6,
    sortColumn: { path: "name", order: "asc" },
  };

  async componentDidMount() {
    const { data: users } = await getUsers();
    const returnedData = users;
    await this.handleUsersList(returnedData);
    //this.setState({ users });
  }

  handleDelete = async (user) => {
    const orginalUsers = this.state.users;
    const users = orginalUsers.filter((u) => u._id !== user._id);

    this.setState({ users });

    try {
      await deleteUser(user._id);
    } catch (ex) {
      // DA 01 03 2023 Add error 400 if User has enrollment cannot remove user.
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

      this.setState({ users: orginalUsers });
    }
  };

  // DA 15-04-2023 Add handleUserList for  mapping of data
  async handleUsersList(returnedData) {
    // Data used to display in the enrollments table
    const users = returnedData.map((user) => {
      const {
        _id,
        name,
        email,
        password,
        isAdmin,
        isInstructor,
        isStudent,
        isParent,
      } = user;

      return {
        _id: _id,
        name: name,
        email: email,
        password: password,
        isAdmin: isAdmin ? "Yes" : "No",
        isInstructor: isInstructor ? "Yes" : "No",
        isStudent: isStudent ? "Yes" : "No",
        isParent: isParent ? "Yes" : "No",
      };
    });

    this.setState({
      users,
    });
  }

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  handleSearch = (query) => {
    this.setState({ searchQuery: query, currentPage: 1 });
  };

  handleSort = (sortColumn) => {
    this.setState({ sortColumn, currentPage: 1 });
  };

  getPagedData = () => {
    const {
      pageSize,
      currentPage,
      sortColumn,
      users: allUsers,
      searchQuery,
    } = this.state;

    let filtered = allUsers;
    if (searchQuery)
      filtered = allUsers.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const sorted = _.orderBy(filtered, [sortColumn.path], [sortColumn.order]);

    const users = paginate(sorted, currentPage, pageSize);

    return { totalCount: filtered.length, data: users };
  };

  render() {
    const { length: count } = this.state.users;
    const { pageSize, currentPage, sortColumn, searchQuery } = this.state;
    const { user } = this.props; // Use use elements to control access to functionality

    if (count === 0)
      return (
        <div className="progress">
          <div
            className="progress-bar bg-info"
            role="progressbar"
            aria-valuenow="55"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            Loading list of Users.........
          </div>
        </div>
      );

    const { totalCount, data: users } = this.getPagedData();

    return (
      <div className="row">
        <div className="col">
          <SearchBox value={searchQuery} onChange={this.handleSearch} />
          {user && (
            <Link
              to="/users/new"
              className="btn btn-success btn-sm border"
              style={{ marginBottom: 20 }}
            >
              Add User
            </Link>
          )}

          <UsersTable
            users={users}
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
          <p>{totalCount} users registered.</p>
        </div>
      </div>
    );
  }
}

export default Users;
