// Import React and Component.
//
// App is a class component, so it extends React's Component class.
import React, { Component } from "react";

// Import the React Router components used to control navigation.
//
// Route:
// Associates a URL with a React component.
//
// Redirect:
// Redirects one URL to another.
//
// Switch:
// Checks the routes from top to bottom and renders the first
// matching route.
import {
  Route,
  Redirect,
  Switch,
} from "react-router-dom";

// ToastContainer provides the container used by react-toastify
// to display notification messages throughout the application.
import { ToastContainer } from "react-toastify";


// ==========================================================
// GLOBAL STYLES
// ==========================================================

// General application styles.
import "./index.css";

// Default styling required by react-toastify.
import "react-toastify/dist/ReactToastify.css";

// Styles associated with the main App component.
import "./App.css";


// ==========================================================
// AUTHENTICATION COMPONENTS
// ==========================================================

// Registration page.
import RegisterForm from "./components/registerForm";

// Login page.
import LoginForm from "./components/loginForm";

// Handles logging the current user out.
import Logout from "./components/common/logout";


// ==========================================================
// COURSE / PRODUCT COMPONENTS
// ==========================================================

// Displays the list of Courses/Products.
import Products from "./components/products";

// Displays the form used to create or edit a Course/Product.
import ProductForm from "./components/productForm";


// ==========================================================
// CUSTOMER / STUDENT COMPONENTS
// ==========================================================

// Displays the list of Customers/Students.
import Customers from "./components/customers";

// Displays an individual Customer/Student record.
//
// This page also contains the related Payments and
// Enrollments sections implemented in previous features.
import CustomerForm from "./components/customerForm";


// ==========================================================
// INSTRUCTOR COMPONENTS
// ==========================================================

// Displays the Instructor list.
import Instructors from "./components/instructors";

// Displays the form used to create or edit an Instructor.
import InstructorForm from "./components/instructorForm";


// ==========================================================
// ENROLLMENT COMPONENTS
// ==========================================================

// Displays Enrollment records and the different
// filtered Enrollment views.
import Enrollments from "./components/enrollments";

// Form used to create a new Enrollment.
import EnrollmentForm from "./components/enrollmentForm";

// Form used to work with an existing Enrollment,
// including its completion information.
import CompleteEnrollmentForm from "./components/completionForm";

// Displays/creates the printable Enrollment invoice.
import EnrollmentPrint from "./components/enrollmentPrint";


// ==========================================================
// PAYMENT COMPONENTS
// ==========================================================

// Form used for Payment operations.
import PaymentForm from "./components/paymentForm";

// Displays the main Payment list.
import Payments from "./components/payments";

// Displays/creates the printable Payment receipt.
import ReceiptPrint from "./components/receiptPrint";


// ==========================================================
// CALENDAR COMPONENT
// ==========================================================
//
// MyCalendar is the application's Calendar page.
//
// Calendar.jsx currently uses:
//
// - React Big Calendar
// - Moment
// - Moment localization
//
// The current version displays static test events.
//
// The Dynamic Calendar feature will later retrieve and
// display:
//
// - Courses
// - Payments
// - Enrollments
//
// from the application's existing data services.
import MyCalendar from "./components/calendar";


// ==========================================================
// USER COMPONENTS
// ==========================================================

// Displays the User list.
import Users from "./components/users";

// Displays the form/record page for an individual User.
import UsersForm from "./components/userForm";


// ==========================================================
// GENERAL APPLICATION COMPONENTS AND SERVICES
// ==========================================================

// Page displayed when a requested route does not exist.
import NotFound from "./components/notFound";

// Main application navigation bar.
import NavBar from "./components/navBar";

// Authentication service.
//
// Used here to determine which user is currently logged in.
import auth from "./services/authService";

// Custom route component used for pages that require
// authentication.
import ProtectedRoute from "./components/common/protectedRoute";

// Application About page.
import AboutPage from "./components/aboutPage";

// React Context used to share theme information throughout
// the component tree.
import ThemeContext from "./components/context/themeContext";

// Footer displayed underneath the application's main content.
import FooterNavbar from "./components/footerBar";


// ==========================================================
// MAIN APPLICATION COMPONENT
// ==========================================================

class App extends Component {

  // ========================================================
  // APPLICATION STATE
  // ========================================================
  //
  // currentTheme stores the application's current theme.
  //
  // First, localStorage is checked for a previously saved
  // theme under "userTheme".
  //
  // If one exists:
  //     use the stored theme.
  //
  // Otherwise:
  //     default to "light".
  //
  // The authenticated user is added to state later inside
  // componentDidMount().
  state = {
    currentTheme: {
      theme: localStorage.getItem("userTheme")
        ? localStorage.getItem("userTheme")
        : "light",
    },
  };


  // ========================================================
  // THEME TOGGLE
  // ========================================================
  //
  // Switch between the application's light and dark themes.
  //
  // This function is passed through ThemeContext so that
  // descendant components can request a theme change.
  //
  // NOTE:
  // This preserves the application's existing implementation.
  // The newThemeState argument is immediately replaced with
  // this.state.currentTheme.
  handleToggleTheme = (newThemeState) => {
    newThemeState = this.state.currentTheme;

    if (newThemeState.theme === "light") {
      newThemeState.theme = "dark";
    } else {
      newThemeState.theme = "light";
    }

    this.setState({
      currentTheme: newThemeState,
    });
  };

  // TODO:
  // Consider moving authenticated-user handling into Context
  // if user authentication is eventually managed globally.


  // ========================================================
  // COMPONENT INITIALIZATION
  // ========================================================
  //
  // componentDidMount() runs once after App has initially
  // been rendered.
  //
  // It asks authService for the currently authenticated user
  // and stores that user in App's state.
  //
  // The user can then be supplied to other components.
  async componentDidMount() {
    const user = await auth.getCurrentUser();

    this.setState({
      user,
    });
  }


  // ========================================================
  // RENDER APPLICATION
  // ========================================================
  //
  // render() determines what the App component displays.
  //
  // When App's state changes, React calls render() again so
  // the interface reflects the latest state.
  render() {

    // Extract the authenticated user from state.
    const { user } = this.state;

    return (
      <React.Fragment>

        {/* ===================================================
            THEME CONTEXT PROVIDER
            ===================================================

            ThemeContext.Provider makes theme information
            available to descendant components.

            It supplies:

            currentTheme
            -> current light/dark theme information

            onToggleTheme
            -> function used to change the theme
        */}
        <ThemeContext.Provider
          value={{
            currentTheme: this.state.currentTheme,
            onToggleTheme: this.handleToggleTheme,
          }}
        >

          {/* Global container for toast notifications. */}
          <ToastContainer />


          {/* =================================================
              MAIN NAVIGATION BAR
              =================================================

              Pass the authenticated user to NavBar.

              NavBar uses this value to determine whether to
              display:

              Logged out:
              - Login
              - Register

              Logged in:
              - User name
              - Logout

              NavBar also contains the link to /calendar.
          */}
          <NavBar user={user} />


          {/* =================================================
              MAIN PAGE LAYOUT
              ================================================= */}
          <div className="row no-gutters">

            <main className="container">


              {/* ===============================================
                  APPLICATION ROUTER
                  ===============================================

                  Switch examines the routes below from top to
                  bottom.

                  The first matching route is rendered.

                  Route order is therefore important where
                  specific routes and parameterized routes share
                  the same URL prefix.
              */}
              <Switch>


                {/* =============================================
                    GENERAL / AUTHENTICATION ROUTES
                    ============================================= */}

                {/* About page. */}
                <Route
                  path="/about"
                  component={AboutPage}
                ></Route>


                {/* Registration page. */}
                <Route
                  path="/register"
                  component={RegisterForm}
                ></Route>


                {/* Login page. */}
                <Route
                  path="/login"
                  component={LoginForm}
                ></Route>


                {/* Logout route. */}
                <Route
                  path="/logout"
                  component={Logout}
                ></Route>


                {/* =============================================
                    COURSE / PRODUCT ROUTES
                    ============================================= */}

                {/* Open a specific Course/Product record.

                    :id is a dynamic URL parameter.

                    Example:

                    /products/66d9ad79...
                */}
                <ProtectedRoute
                  path="/products/:id"
                  component={ProductForm}
                ></ProtectedRoute>


                {/* Display the main Course/Product list.

                    The render prop allows the normal Router
                    props and the authenticated user to be
                    supplied to Products.
                */}
                <Route
                  path="/products"
                  render={(props) => (
                    <Products
                      {...props}
                      user={this.state.user}
                    />
                  )}
                ></Route>


                {/* =============================================
                    CUSTOMER / STUDENT ROUTES
                    ============================================= */}

                {/* Open a specific Customer/Student record.

                    Example:

                    /customers/66d9ad79...

                    This route also handles:

                    /customers/new

                    because "new" becomes the value of :id.
                */}
                <ProtectedRoute
                  path="/customers/:id"
                  component={CustomerForm}
                ></ProtectedRoute>


                {/* Display the main Customer/Student list. */}
                <ProtectedRoute
                  path="/customers"
                  component={Customers}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* =============================================
                    INSTRUCTOR ROUTES
                    ============================================= */}

                {/* Open a specific Instructor record. */}
                <ProtectedRoute
                  path="/instructors/:id"
                  component={InstructorForm}
                ></ProtectedRoute>


                {/* Display the main Instructor list. */}
                <ProtectedRoute
                  path="/instructors"
                  component={Instructors}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* =============================================
                    ENROLLMENT FILTER ROUTES
                    =============================================

                    These routes display different filtered
                    views of the Enrollment collection.

                    IMPORTANT:

                    These specific routes appear BEFORE:

                    /enrollments/:id

                    Otherwise React Router could interpret values
                    such as "_all" as an Enrollment ID.
                */}


                {/* Display all Enrollments. */}
                <ProtectedRoute
                  path="/enrollments/_all"
                  component={Enrollments}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* Display completed and paid Enrollments. */}
                <ProtectedRoute
                  path="/enrollments/_completedPaid"
                  component={Enrollments}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* Display completed but unpaid Enrollments. */}
                <ProtectedRoute
                  path="/enrollments/_completedNotPaid"
                  component={Enrollments}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* Display paid Enrollments. */}
                <ProtectedRoute
                  path="/enrollments/_enrollmentsPaid"
                  component={Enrollments}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* Display Enrollments that are enrolled,
                    incomplete, and unpaid.
                */}
                <ProtectedRoute
                  path="/enrollments/_enrolledNotCompletedNotPaid"
                  component={Enrollments}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* =============================================
                    ENROLLMENT CRUD ROUTES
                    ============================================= */}

                {/* Create a new Enrollment.

                    This route must appear before /enrollments/:id
                    so that "new" is not interpreted as an ID.
                */}
                <ProtectedRoute
                  path="/enrollments/new"
                  component={EnrollmentForm}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* Open an existing Enrollment record.

                    :id contains the Enrollment's database ID.
                */}
                <ProtectedRoute
                  path="/enrollments/:id"
                  component={CompleteEnrollmentForm}
                ></ProtectedRoute>


                {/* Main Enrollment listing page. */}
                <ProtectedRoute
                  path="/enrollments"
                  component={Enrollments}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* =============================================
                    ENROLLMENT PRINT / INVOICE ROUTE
                    =============================================

                    Used by the Invoice functionality.

                    EnrollmentPrint can retrieve the appropriate
                    Enrollment and related records using the
                    enrollmentId supplied through React Router
                    state.
                */}
                <ProtectedRoute
                  path="/enrollmentPrint"
                  component={EnrollmentPrint}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* =============================================
                    PAYMENT ROUTES
                    ============================================= */}

                {/* Main Payment listing page. */}
                <ProtectedRoute
                  path="/payments"
                  component={Payments}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* Payment form. */}
                <ProtectedRoute
                  path="/paymentForm"
                  component={PaymentForm}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* =============================================
                    RECEIPT PRINT ROUTE
                    =============================================

                    Used by the Receipt action in the Payments
                    table and the existing Enrollment workflow.
                */}
                <ProtectedRoute
                  path="/receiptPrint"
                  component={ReceiptPrint}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* =============================================
                    USER ROUTES
                    ============================================= */}

                {/* Open a specific User record.

                    :id contains the User's database ID.
                */}
                <ProtectedRoute
                  path="/users/:id"
                  component={UsersForm}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* Display the main User list. */}
                <ProtectedRoute
                  path="/users"
                  component={Users}
                  user={this.state.user}
                ></ProtectedRoute>


                {/* =============================================
                    CALENDAR ROUTE
                    =============================================

                    This route displays the Calendar page.

                    The navigation flow is:

                    NavBar
                       ↓
                    Calendar link
                       ↓
                    /calendar
                       ↓
                    ProtectedRoute
                       ↓
                    MyCalendar
                       ↓
                    Calendar.jsx
                       ↓
                    React Big Calendar

                    Because this is a ProtectedRoute, the Calendar
                    page is available only through the existing
                    protected-route authentication mechanism.

                    MyCalendar currently does not require any
                    additional prop from App.

                    The previous:

                    user={this.state.calendar}

                    has therefore been removed.

                    Calendar.jsx will obtain the Course, Payment,
                    and Enrollment data it needs through the
                    application's service layer as the Dynamic
                    Calendar feature is implemented.
                */}
                <ProtectedRoute
                  path="/calendar"
                  component={MyCalendar}
                ></ProtectedRoute>


                {/* =============================================
                    NOT FOUND ROUTE
                    ============================================= */}

                {/* Explicit Not Found page. */}
                <Route
                  path="/not-found"
                  component={NotFound}
                ></Route>


                {/* =============================================
                    DEFAULT ROOT REDIRECT
                    =============================================

                    Visiting:

                    /

                    redirects to:

                    /products

                    "exact" is important because "/" would
                    otherwise match every URL beginning with "/".
                */}
                <Redirect
                  from="/"
                  exact
                  to="/products"
                />


                {/* =============================================
                    FALLBACK REDIRECT
                    =============================================

                    If none of the routes above match the URL,
                    redirect the user to the Not Found page.

                    Because this is the final entry in Switch,
                    it acts as the application's catch-all route.
                */}
                <Redirect to="/not-found" />

              </Switch>


              {/* ===============================================
                  FOOTER
                  ===============================================

                  The footer is rendered underneath whichever
                  page was selected by React Router.
              */}
              <FooterNavbar />

            </main>
          </div>

        </ThemeContext.Provider>

      </React.Fragment>
    );
  }
}


// Export App so that it can be used as the application's
// root React component.
export default App;