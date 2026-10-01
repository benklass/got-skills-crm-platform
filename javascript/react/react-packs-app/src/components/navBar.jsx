// Import React so that this file can define a React component.
//
// useState is a React Hook that allows this functional component
// to store and update its current theme.
import React, { useState } from "react";

// Link and NavLink are provided by React Router.
//
// Link:
// Used for normal navigation without reloading the entire web page.
//
// NavLink:
// Similar to Link, but designed specifically for navigation menus.
// It can also identify when its route is currently active.
import { Link, NavLink } from "react-router-dom";

// Import the application's custom ThemeToggle component.
import ThemeToggle from "./common/themeToggle";


// ==========================================================
// NAVIGATION BAR COMPONENT
// ==========================================================
//
// NavBar is a functional React component.
//
// It receives "user" as a prop.
//
// user:
// Contains the currently authenticated user's information.
// If no user is logged in, user will be null/undefined.
//
// The value of user is used later to decide whether to display:
//
// Logged out:
//   Login
//   Register
//
// Logged in:
//   User's name
//   Logout
const NavBar = ({ user }) => {

  // ========================================================
  // THEME STATE
  // ========================================================
  //
  // Store the currently selected application theme.
  //
  // "theme" contains the current value.
  // "setTheme" changes that value.
  //
  // The initial theme is "light".
  const [theme, setTheme] = useState("light");


  // ========================================================
  // THEME TOGGLE
  // ========================================================
  //
  // Switch between the application's light and dark themes.
  //
  // If the current theme is light:
  //     change it to dark.
  //
  // Otherwise:
  //     change it back to light.
  //
  // This function is passed to the ThemeToggle component below.
  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };


  // ========================================================
  // NAVIGATION BAR
  // ========================================================
  //
  // Render the application's main Bootstrap navigation bar.
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">

      {/* ====================================================
          APPLICATION LOGO
          ====================================================

          Clicking the logo navigates back to the application's
          home page without performing a full browser reload.
      */}
      <Link className="navbar-brand" to="/">
        <img
          src="assets/packs-logo.png"
          width="65"
          height="45"
          alt=""
        ></img>
      </Link>


      {/* ====================================================
          RESPONSIVE NAVIGATION TOGGLE
          ====================================================

          Bootstrap uses this button when the screen becomes
          too narrow to display the full navigation menu.

          Clicking it expands or collapses the navigation links.

          data-target="#navbarNavAltMarkup" connects this button
          to the collapsible <div> below with the matching ID.
      */}
      <button
        className="navbar-toggler mr-2"
        type="button"
        data-toggle="collapse"
        data-target="#navbarNavAltMarkup"
        aria-controls="navbarNavAltMarkup"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>


      {/* Application name displayed next to the logo. */}
      <h5 className="font-weight-bold mr-auto navbar-nav btn btn-lg text-secondary">
        Got Skills
      </h5>


      {/* ====================================================
          COLLAPSIBLE NAVIGATION CONTENT
          ====================================================

          This section contains the application's navigation
          links and ThemeToggle component.

          On smaller screens, Bootstrap can collapse this
          section behind the navigation toggle button.
      */}
      <div
        className="collapse navbar-collapse"
        id="navbarNavAltMarkup"
      >

        <ul className="navbar-nav mr-auto mt-lg-0 rounded">

          {/* ==================================================
              COURSES
              ==================================================

              Navigate to the Product/Course listing page.
          */}
          <li>
            <NavLink
              className="nav-item nav-link btn btn-info btn-sm btn-rounded mr-1 font-weight-bold text-light border rounded"
              to="/products"
            >
              Courses
            </NavLink>
          </li>


          {/* ==================================================
              STUDENTS
              ==================================================

              Navigate to the Customer/Student listing page.
          */}
          <li>
            <NavLink
              className="nav-item nav-link btn btn-info btn-sm mr-1 font-weight-bold text-light border"
              to="/customers"
            >
              Students
            </NavLink>
          </li>


          {/* ==================================================
              ENROLLMENTS
              ==================================================

              Navigate to the Enrollment listing page.
          */}
          <li>
            <NavLink
              className="nav-item nav-link btn btn-info btn-sm mr-1 font-weight-bold text-light border"
              to="/enrollments"
            >
              Enrollments
            </NavLink>
          </li>


          {/* ==================================================
              PAYMENTS
              ==================================================

              Navigate to the Payment listing page.
          */}
          <li>
            <NavLink
              className="nav-item nav-link btn btn-info btn-sm mr-1 font-weight-bold text-light border"
              to="/payments"
            >
              Payments
            </NavLink>
          </li>


          {/* ==================================================
              USERS
              ==================================================

              Navigate to the application User listing page.
          */}
          <li>
            <NavLink
              className="nav-item nav-link btn btn-info btn-sm mr-1 font-weight-bold text-light border"
              to="/users"
            >
              Users
            </NavLink>
          </li>


          {/* ==================================================
              INSTRUCTORS
              ==================================================

              Navigate to the Instructor listing page.
          */}
          <li>
            <NavLink
              className="nav-item nav-link btn btn-info btn-sm mr-1 font-weight-bold text-light border"
              to="/instructors"
            >
              Instructors
            </NavLink>
          </li>


          {/* ==================================================
              CALENDAR
              ==================================================

              Navigate to the Calendar page.

              This is the navigation entry for the new Calendar
              feature implemented with React Big Calendar.

              The /calendar route should correspond to the
              Calendar route configured elsewhere in the
              application, normally in App.js.
          */}
          <li>
            <NavLink
              className="nav-item nav-link btn btn-info btn-sm mr-1 font-weight-bold text-light border"
              to="/calendar"
            >
              Calendar
            </NavLink>
          </li>


          {/* ==================================================
              LINKS FOR USERS WHO ARE NOT LOGGED IN
              ==================================================

              If "user" does not exist, display Login and
              Register.

              React.Fragment groups the two <li> elements
              without adding another HTML element to the DOM.
          */}
          {!user && (
            <React.Fragment>

              <li>
                <NavLink
                  className="nav-item nav-link btn btn-info btn-sm mr-1 font-weight-bold text-light border"
                  to="/login"
                >
                  Login
                </NavLink>
              </li>

              <li>
                <NavLink
                  className="nav-item nav-link btn btn-info btn-sm mr-1 font-weight-bold text-light border"
                  to="/register"
                >
                  Register
                </NavLink>
              </li>

            </React.Fragment>
          )}


          {/* ==================================================
              LINKS FOR AUTHENTICATED USERS
              ==================================================

              If "user" exists, the user is currently logged in.

              Display:
              1. A link to that user's record/profile.
              2. The Logout link.
          */}
          {user && (
            <React.Fragment>

              {/* Navigate to the currently logged-in user's page.

                  user._id supplies the MongoDB ID used in the URL.

                  Example:

                  /users/66d9ad79...
              */}
              <li>
                <NavLink
                  className="nav-item nav-link btn btn-info btn-sm mr-1 font-weight-bold text-light border"
                  to={`/users/${user._id}`}
                >
                  {user.name}
                </NavLink>
              </li>


              {/* Log out of the application. */}
              <li>
                <NavLink
                  className="nav-item nav-link btn btn-info btn-sm mr-1 font-weight-bold text-light border"
                  to="/logout"
                >
                  Logout
                </NavLink>
              </li>

            </React.Fragment>
          )}


          {/* ==================================================
              ABOUT
              ==================================================

              Navigate to the application's About page.

              sr-only is a Bootstrap accessibility class.
              "(current)" is available to screen readers but is
              not normally visible on screen.
          */}
          <li>
            <NavLink
              className="nav-item nav-link btn btn-info btn-sm mr-1 font-weight-bold text-light border"
              to="/about"
            >
              About
              <span className="sr-only">
                (current)
              </span>
            </NavLink>
          </li>

        </ul>


        {/* ====================================================
            THEME TOGGLE
            ====================================================

            Pass the current theme and toggleTheme function to
            the application's ThemeToggle component.

            ThemeToggle can therefore see whether the current
            theme is light/dark and request a change by calling
            toggleTheme().
        */}
        <ThemeToggle
          className="border"
          theme={theme}
          toggleTheme={toggleTheme}
        />

      </div>
    </nav>
  );
};


// Export NavBar so that it can be imported and rendered by
// the application's main layout/App component.
export default NavBar;