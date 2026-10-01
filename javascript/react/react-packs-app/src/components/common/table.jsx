import React, { useContext } from "react";
import TableHeader from "./tableHeader";
import TableBody from "./tableBody";
import ThemeContext from "../context/themeContext";

const Table = ({ columns, sortColumn, onSort, data }, props) => {
  const toogleTheme = useContext(ThemeContext);

  return (
    <table
      className={`table ${
        toogleTheme.currentTheme.theme === "dark" ? "text-light" : ""
      } table-striped table-hover`}
    >
      <TableHeader columns={columns} sortColumn={sortColumn} onSort={onSort} />
      <TableBody columns={columns} data={data} />
    </table>
  );
};

export default Table;
