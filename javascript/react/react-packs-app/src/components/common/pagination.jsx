/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";

import _ from "lodash";

const Pagination = ({ itemsCount, pageSize, currentPage, onPageChange }) => {
  const pagesCount = Math.ceil(itemsCount / pageSize);
  if (pagesCount === 1) return null;
  const pages = _.range(1, pagesCount + 1); // use this to output the correct format to the page

  return (
    <nav aria-label="...">
      <ul className="pagination">
        {pages.map((page) => (
          <li
            key={page}
            className={
              page === currentPage
                ? "page-item active bg-secondary text-light"
                : "page-item bg-secondary text-light"
            }
          >
            <a
              className="page-link bg-secondary btn-outline-secondary btn-secondary text-light"
              href="#"
              onClick={() => onPageChange(page)}
            >
              {page}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Pagination;
