import React, { Component } from "react";
import { Link } from "react-router-dom";

import auth from "../services/authService";
import Table from "./common/table";

class EnrollmentTable extends Component {
  // ==========================================================
  // TABLE COLUMN DEFINITIONS
  // ==========================================================
  //
  // Each object in this array defines one visible column in the
  // Enrollment table.
  //
  // "path" tells the shared Table component which property from
  // each Enrollment row should be used for sorting.
  //
  // "label" is the text displayed in the table header.
  //
  // "content" is optional and lets us render custom JSX instead
  // of simply displaying the raw value from the path.
  columns = [
    {
      path: "name",
      label: "Student",

      // Display the student's name as a link to the
      // corresponding Customer / Student record.
      content: (enrollment) => (
        <Link
          to={`/customers/${enrollment.customerId}`}
          className="col-12 font-weight-bold btn btn-sm btn-info"
        >
          {enrollment.name}
        </Link>
      ),
    },

    {
      path: "product",
      label: "Course",

      // Display the course name as a link to the
      // corresponding Product / Course record.
      content: (enrollment) => (
        <Link
          to={`/products/${enrollment.productId}`}
          className="col-12 font-weight-bold btn btn-sm btn-info"
        >
          {enrollment.product}
        </Link>
      ),
    },

    // Standard data columns.
    //
    // These do not need custom content functions because the
    // shared Table component can read the value directly from
    // the specified path.
    { path: "startDate", label: "Start" },
    { path: "endDate", label: "End" },
    { path: "productPrice", label: "Course Fee R." },
    { path: "enrollmentDate", label: "Enrolled" },
    { path: "enrollmentFee", label: "Enrolled Fee R." },
    { path: "completionDate", label: "Completed" },
    { path: "enrollmentPaid", label: "Paid" },
  ];

  // ==========================================================
  // EDIT ACTION COLUMN
  // ==========================================================
  //
  // This column contains an action rather than Enrollment data.
  //
  // It uses "key" instead of "path" because there is no
  // Enrollment property called "enrollment" that needs to be
  // displayed or sorted.
  //
  // sortable: false tells the shared TableHeader component that
  // this column must not behave like a sortable data column.
  enrollmentCompleteColumn = {
    key: "enrollment",
    label: "Edit",
    sortable: false,

    // Open the selected Enrollment record in the existing
    // Enrollment form.
    content: (enrollment) => (
      <Link
        to={`/enrollments/${enrollment._id}`}
        className="font-weight-bold btn btn-sm btn-success"
      >
        Edit
      </Link>
    ),
  };

  // ==========================================================
  // CONSTRUCTOR / USER ACCESS
  // ==========================================================
  //
  // The Edit column is added only when there is a currently
  // authenticated user.
  //
  // At present, this does NOT distinguish between Admin,
  // Instructor, Editor, or other user roles. Any authenticated
  // user receives the Edit column.
  //
  // If role-based access is introduced later, the condition
  // below can be changed accordingly.
  constructor() {
    super();

    const user = auth.getCurrentUser();

    // Add the Edit action only for authenticated users.
    if (user) {
      this.columns.push(this.enrollmentCompleteColumn);
    }
  }

  // ==========================================================
  // RENDER TABLE
  // ==========================================================
  //
  // EnrollmentTable does not build the HTML table itself.
  // Instead, it passes the Enrollment data and column
  // definitions into the reusable Table component.
  //
  // Props received:
  //
  // enrollments -> array of formatted Enrollment rows
  // onSort      -> sorting handler supplied by the parent
  // sortColumn  -> currently active sort column/direction
  render() {
    const {
      enrollments,
      onSort,
      sortColumn,
    } = this.props;

    return (
      <Table
        columns={this.columns}
        data={enrollments}
        sortColumn={sortColumn}
        onSort={onSort}
      />
    );
  }
}

export default EnrollmentTable;