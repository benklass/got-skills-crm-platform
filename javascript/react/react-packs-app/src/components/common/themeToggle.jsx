// This was created with the help of chatGPT
//
import React, { useEffect, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import ThemeContext from "../context/themeContext";

const ThemeToggle = () => {
  const themeContext = useContext(ThemeContext);
  const theme = themeContext.currentTheme.theme;
  localStorage.setItem("userTheme", theme);

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("bg-dark");
      document
        .querySelector(".navbar")
        .classList.add("bg-dark", "navbar-dark", "text-light");
      const links = document.querySelectorAll(".navbar a");
      links.forEach((link) => link.classList.add("text-light"));
      const listGroupItems = document.querySelectorAll(".list-group-item");
      listGroupItems.forEach((item) =>
        item.classList.add("list-group-item-dark")
      );
      const tables = document.querySelectorAll("table");
      tables.forEach((table) => table.classList.add("text-light"));
    } else {
      document.body.classList.remove("bg-dark");
      document
        .querySelector(".navbar")
        .classList.remove("bg-dark", "navbar-dark", "text-light");
      const links = document.querySelectorAll(".navbar a");
      links.forEach((link) => link.classList.remove("text-light"));
      const listGroupItems = document.querySelectorAll(".list-group-item");
      listGroupItems.forEach((item) =>
        item.classList.remove("list-group-item-dark")
      );
      const tables = document.querySelectorAll("table");
      tables.forEach((table) => table.classList.remove("text-light"));
    }
  }, [theme]);

  return (
    <div>
      <button
        onClick={() => themeContext.onToggleTheme("theme")}
        className="btn btn-secondary bg-dark no-bordered"
      >
        {theme === "light" ? (
          <FontAwesomeIcon icon={faMoon} />
        ) : (
          <FontAwesomeIcon icon={faSun} />
        )}
      </button>
    </div>
  );
};

export default ThemeToggle;
