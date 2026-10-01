import React, { Component } from "react";

class TableHeader extends Component {
  // Handles sorting when a sortable table header is clicked.
  // If the same column is clicked again, toggle between ascending
  // and descending order. If a different column is clicked,
  // begin sorting that column in ascending order.
  raiseSort = (path) => {
    const sortColumn = { ...this.props.sortColumn };

    if (sortColumn.path === path)
      sortColumn.order = sortColumn.order === "asc" ? "desc" : "asc";
    else {
      sortColumn.path = path;
      sortColumn.order = "asc";
    }

    this.props.onSort(sortColumn);
  };

  // Displays the appropriate sort icon for the currently sorted column.
  // Columns marked with sortable: false are action columns and should
  // not display a sorting icon.
  renderSortIcon = (column) => {
    const { sortColumn } = this.props;

    if (column.sortable === false) return null;
    if (column.path !== sortColumn.path) return null;

    if (sortColumn.order === "asc")
      return <i className="fa fa-sort-asc"></i>;

    return <i className="fa fa-sort-desc"></i>;
  };

  render() {
    return (
      <thead>
        <tr>
          {this.props.columns.map((column) => (
            <th
              // Normal data columns remain sortable by default.
              // Action columns, such as Download Invoice and
              // Download Receipt, use sortable: false and are
              // therefore neither clickable nor sortable.
              className={column.sortable === false ? "" : "clickable"}
              key={column.path || column.key}
              onClick={() =>
                column.sortable !== false && this.raiseSort(column.path)
              }
            >
              {column.label} {this.renderSortIcon(column)}
            </th>
          ))}
        </tr>
      </thead>
    );
  }
}

export default TableHeader;