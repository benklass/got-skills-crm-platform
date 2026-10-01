import React from "react";
import { toast } from "react-toastify";

import Joi from "joi-browser";
import Form from "./common/form";

import {
  getCustomer,
  saveCustomer,
} from "../services/customerService";

// Retrieves all payments associated with the current customer.
import {
  getPaymentsByCustomerId,
} from "../services/paymentService";

// Retrieves all enrollments whose embedded customer._id
// matches the current Student record.
import {
  getEnrollmentsByCustomerId,
} from "../services/enrollmentService";

// Reuses the existing Payments table component.
import PaymentsTable from "./paymentsTable";

// Reuses the existing Enrollment table component.
import EnrollmentTable from "./enrollmentsTable";

// Lodash is used to sort the Payment and Enrollment arrays
// before passing them to their respective table components.
import _ from "lodash";

class CustomerForm extends Form {
  // ==========================================================
  // COMPONENT STATE
  // ==========================================================
  //
  // State is the component's internal working memory.
  //
  // Customer form fields are stored in state.data.
  //
  // Related Payment and Enrollment records are deliberately
  // stored separately so they are not accidentally submitted
  // as part of the Customer payload.
  state = {
    // --------------------------------------------------------
    // EDITABLE CUSTOMER / STUDENT DATA
    // --------------------------------------------------------
    data: {
      name: "",
      grade: "",
      email: "",
      phone: "",
      address: "",
      comments: "",
      active: false,
    },

    // Joi validation errors for the Customer form.
    errors: {},

    // --------------------------------------------------------
    // CUSTOMER PAYMENTS
    // --------------------------------------------------------

    // All Payment records associated with the current customer.
    payments: [],

    // Stores the currently selected Payment sorting column
    // and sorting direction.
    paymentSortColumn: {
      path: "transactionDate",
      order: "desc",
    },

    // Tracks Payment request state independently.
    paymentsLoading: false,
    paymentsError: "",

    // --------------------------------------------------------
    // CUSTOMER ENROLLMENTS
    // --------------------------------------------------------

    // All Enrollment records associated with the current customer.
    enrollments: [],

    // Stores the currently selected Enrollment sorting column
    // and sorting direction.
    //
    // This is separate from paymentSortColumn so the two
    // tables can be sorted independently.
    enrollmentSortColumn: {
      path: "enrollmentDate",
      order: "desc",
    },

    // Tracks Enrollment request state independently.
    enrollmentsLoading: false,
    enrollmentsError: "",
  };

  // ==========================================================
  // CUSTOMER FORM VALIDATION
  // ==========================================================

  // Joi validation rules used by the shared Form component
  // before a Customer can be saved.
  schema = {
    _id: Joi.string(),

    name: Joi.string()
      .min(6)
      .max(50)
      .required()
      .label("Name"),

    phone: Joi.string()
      .min(7)
      .max(16)
      .regex(
        /^(\d{3}-\d{3}-\d{4}$)/,
        "Number format 999-999-9999 "
      )
      .required()
      .label("Phone"),

    email: Joi.string()
      .min(7)
      .max(50)
      .email()
      .required(),

    grade: Joi.string()
      .min(7)
      .max(25)
      .required(),

    address: Joi.string()
      .min(10)
      .max(50)
      .required(),

    comments: Joi.string()
      .max(2000),

    active: Joi.boolean()
      .label("Active"),
  };

  // ==========================================================
  // LOAD CUSTOMER
  // ==========================================================

  // Retrieves the Customer record identified by the :id
  // parameter in the /customers/:id route.
  async populateCustomer() {
    try {
      const customerId = this.props.match.params.id;

      // A new Customer does not yet exist in MongoDB.
      if (customerId === "new") return;

      const { data: customer } = await getCustomer(
        customerId
      );

      // Convert the backend Customer object into the flat
      // structure expected by CustomerForm.
      this.setState({
        data: this.mapToViewModel(customer),
      });
    } catch (ex) {
      if (ex.response) {
        switch (ex.response.status) {
          case 404:
            toast.error(ex.response.data);
            break;

          case 500:
            toast.error(ex.response.data);
            break;

          default:
            toast.error(
              "CustomerForm : Unspecified Error Occured"
            );
        }
      } else {
        toast.error(
          "Unable to load customer."
        );
      }

      this.props.history.replace(
        "/not-found"
      );
    }
  }

  // ==========================================================
  // LOAD CUSTOMER PAYMENTS
  // ==========================================================

  // Retrieves and formats all Payment records associated with
  // the current Customer.
  async populatePayments() {
    try {
      const customerId = this.props.match.params.id;

      // A new unsaved Customer cannot have Payment records.
      if (customerId === "new") return;

      // Tell the UI that Payment data is loading.
      this.setState({
        paymentsLoading: true,
        paymentsError: "",
      });

      // Retrieve all Payments whose customerId matches the
      // current Customer.
      const { data } =
        await getPaymentsByCustomerId(
          customerId
        );

      // Convert raw Payment documents into the structure
      // expected by PaymentsTable.
      const payments = data.map((payment) => {
        const formatTransactionDate =
          new Date(
            payment.transactionDate
          );

        // Existing project convention:
        // derive a numeric transaction value from enrollmentId.
        const mPaymentIdTimestamp =
          payment.enrollmentId
            ? parseInt(
                payment.enrollmentId
                  .toString()
                  .substr(0, 10),
                16
              )
            : "";

        return {
          ...payment,

          // Format transaction date for display.
          transactionDate:
            formatTransactionDate
              .toLocaleDateString(
                "en-ZA",
                {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }
              ),

          // MongoDB monetary values are stored as Decimal128.
          grossAmount:
            payment.grossAmount
              ? Math.round(
                  payment.grossAmount
                    .$numberDecimal
                )
              : "",

          netAmount:
            payment.netAmount
              ? Math.round(
                  payment.netAmount
                    .$numberDecimal
                )
              : "",

          feeAmount:
            payment.feeAmount
              ? Math.round(
                  payment.feeAmount
                    .$numberDecimal
                )
              : "",

          // Convert Boolean value into display text.
          isFullPayment:
            payment.isFullPayment
              ? "Yes"
              : "No",

          mPaymentIdTimestamp,
        };
      });

      // Save the formatted Payment records and clear
      // the loading/error states.
      this.setState({
        payments,
        paymentsLoading: false,
        paymentsError: "",
      });
    } catch (ex) {
      console.error(
        "populatePayments error:",
        ex
      );

      // Payment errors are isolated from the rest of the
      // Customer page.
      this.setState({
        paymentsLoading: false,
        paymentsError:
          "Unable to load payments.",
      });
    }
  }

  // ==========================================================
  // LOAD CUSTOMER ENROLLMENTS
  // ==========================================================

  // Retrieves and formats all Enrollment records associated
  // with the current Customer / Student.
  //
  // Flow:
  //
  // Customer ID
  //     ↓
  // getEnrollmentsByCustomerId()
  //     ↓
  // GET /api/enrollments/customer/:customerId
  //     ↓
  // Enrollment[]
  //     ↓
  // Format rows
  //     ↓
  // this.state.enrollments
  async populateEnrollments() {
    try {
      const customerId =
        this.props.match.params.id;

      // A new unsaved Customer cannot have Enrollment records.
      if (customerId === "new") return;

      // Tell the UI that Enrollment data is loading.
      this.setState({
        enrollmentsLoading: true,
        enrollmentsError: "",
      });

      // Retrieve every Enrollment whose embedded customer._id
      // matches the current Customer.
      const { data } =
        await getEnrollmentsByCustomerId(
          customerId
        );

      // Convert the raw Enrollment documents into the flat
      // structure expected by EnrollmentTable.
      //
      // This follows the same formatting convention used by
      // the application's main Enrollments page.
      const enrollments = data.map(
        (enrollment) => {
          const {
            _id,
            customer,
            product,
            enrollmentDate,
            enrollmentFee,
            enrollmentPaid,
            completionDate,
          } = enrollment;

          // Convert Product dates into JavaScript Date objects.
          const startDate =
            new Date(
              product.startDate
            );

          const endDate =
            new Date(
              product.endDate
            );

          // Convert the Enrollment date for display.
          const formatEnrollmentDate =
            new Date(
              enrollmentDate
            );

          // completionDate is optional.
          const formatCompletionDate =
            completionDate
              ? new Date(
                  completionDate
                ).toLocaleDateString(
                  "en-ZA"
                )
              : null;

          return {
            // Enrollment MongoDB ID.
            // Used by the Edit link in EnrollmentTable.
            _id,

            // Embedded Customer information.
            customerId:
              customer._id,

            name:
              customer.name,

            // Embedded Product / Course information.
            productId:
              product._id,

            product:
              product.name,

            // Display-formatted course dates.
            startDate:
              startDate
                .toLocaleDateString(
                  "en-ZA"
                ),

            endDate:
              endDate
                .toLocaleDateString(
                  "en-ZA"
                ),

            // Convert Decimal128 Product price to a display number.
            productPrice:
              Math.round(
                product.productPrice
                  .$numberDecimal
              ),

            // Format the date on which the student enrolled.
            enrollmentDate:
              formatEnrollmentDate
                .toLocaleDateString(
                  "en-ZA"
                ),

            // Convert optional Decimal128 enrollment fee.
            enrollmentFee:
              enrollmentFee
                ? Math.round(
                    enrollmentFee
                      .$numberDecimal
                  )
                : "",

            // Existing project convention:
            //
            // Completed enrollment → completion date
            // Active enrollment    → "busy"
            completionDate:
              formatCompletionDate
                ? formatCompletionDate
                : "busy",

            // Convert Boolean status into display text.
            enrollmentPaid:
              enrollmentPaid
                ? "Yes"
                : "No",
          };
        }
      );

      // Store the formatted Enrollment records.
      this.setState({
        enrollments,
        enrollmentsLoading: false,
        enrollmentsError: "",
      });
    } catch (ex) {
      console.error(
        "populateEnrollments error:",
        ex
      );

      // Enrollment errors remain isolated from Customer and
      // Payment data so the rest of the page remains usable.
      this.setState({
        enrollmentsLoading: false,
        enrollmentsError:
          "Unable to load enrollments.",
      });
    }
  }

  // ==========================================================
  // TABLE SORTING
  // ==========================================================

  // Updates the selected Payments-table column
  // and sort direction.
  handlePaymentSort = (
    paymentSortColumn
  ) => {
    this.setState({
      paymentSortColumn,
    });
  };

  // Updates the selected Enrollments-table column
  // and sort direction.
  //
  // Keeping separate sorting state means sorting one
  // table does not alter the other.
  handleEnrollmentSort = (
    enrollmentSortColumn
  ) => {
    this.setState({
      enrollmentSortColumn,
    });
  };

  // ==========================================================
  // COMPONENT LIFECYCLE
  // ==========================================================

  // React calls componentDidMount() once after CustomerForm
  // has been mounted on the page.
  //
  // Customer details, Payments, and Enrollments are independent
  // requests, so Promise.all() allows them to load concurrently.
  async componentDidMount() {
    await Promise.all([
      this.populateCustomer(),
      this.populatePayments(),
      this.populateEnrollments(),
    ]);
  }

  // ==========================================================
  // MAP BACKEND CUSTOMER TO FORM DATA
  // ==========================================================

  // Converts the backend Customer object into the flat
  // data structure expected by the form.
  mapToViewModel(customer) {
    return {
      _id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      grade: customer.grade,
      comments: customer.comments,
      active: customer.active,
    };
  }

  // ==========================================================
  // SAVE CUSTOMER
  // ==========================================================

  // Called after validation succeeds.
  doSubmit = async () => {
    try {
      // Only Customer form data is submitted.
      //
      // Payments and Enrollments remain separate state
      // properties and are not sent to saveCustomer().
      await saveCustomer(
        this.state.data
      );

      // Return to the page that opened CustomerForm.
      this.props.history.goBack();
    } catch (ex) {
      if (ex.response) {
        switch (ex.response.status) {
          case 400:
            toast.error(
              ex.response.data +
                " Correct Input"
            );
            break;

          case 500:
            toast.error(
              ex.response.data
            );

            this.props.history.goBack();
            break;

          default:
            toast.error(
              "customerForm : Unspecified Error Occured"
            );

            this.props.history.goBack();
        }
      } else {
        toast.error(
          "Unable to save customer."
        );
      }
    }
  };

  // ==========================================================
  // RENDER CUSTOMER FORM
  // ==========================================================

  // render() determines what CustomerForm currently displays.
  //
  // React runs render() again whenever this component's state
  // changes, allowing loading messages, errors, empty states,
  // and tables to update automatically.
  render() {
    const {
      // Payment-related state.
      payments,
      paymentSortColumn,
      paymentsLoading,
      paymentsError,

      // Enrollment-related state.
      enrollments,
      enrollmentSortColumn,
      enrollmentsLoading,
      enrollmentsError,
    } = this.state;

    // Determines whether the page is creating a new Customer.
    const isNewCustomer =
      this.props.match.params.id ===
      "new";

    // Sort Payments using only the Payments-table sorting state.
    const sortedPayments = _.orderBy(
      payments,
      [
        paymentSortColumn.path,
      ],
      [
        paymentSortColumn.order,
      ]
    );

    // Sort Enrollments independently using the
    // Enrollments-table sorting state.
    const sortedEnrollments =
      _.orderBy(
        enrollments,
        [
          enrollmentSortColumn.path,
        ],
        [
          enrollmentSortColumn.order,
        ]
      );

    return (
      <div>
        <h1>Student</h1>

        <form
          onSubmit={this.handleSubmit}
        >
          {/* ==================================================
              CUSTOMER DETAILS
             ================================================== */}

          <div className="row">
            <div className="col-md-6">
              {this.renderInput(
                "name",
                "Name"
              )}

              {this.renderInput(
                "phone",
                "Phone"
              )}

              {this.renderInput(
                "email",
                "Email"
              )}

              {this.renderTextarea(
                "address",
                "Address",
                "text",
                "4"
              )}
            </div>

            <div className="col-md-6">
              {this.renderUseSelect(
                "active",
                "Student Active"
              )}

              {this.renderInput(
                "grade",
                "Grade"
              )}

              {this.renderTextarea(
                "comments",
                "Comments",
                "text",
                "5"
              )}
            </div>
          </div>

          {/* ==================================================
              CUSTOMER PAYMENTS
             ==================================================

              Existing Customers display one of four states:

              1. Loading
              2. API error
              3. No Payments
              4. Payments table

              Hidden on /customers/new because an unsaved
              Customer has no MongoDB ID.
          */}

          {!isNewCustomer && (
            <div className="row mt-4">
              <div className="col-12">
                <h3>Payments</h3>

                {paymentsLoading ? (
                  <p>
                    Loading payments...
                  </p>
                ) : paymentsError ? (
                  <p>
                    {paymentsError}
                  </p>
                ) : payments.length ===
                  0 ? (
                  <p>
                    No payments recorded
                    for this student.
                  </p>
                ) : (
                  <PaymentsTable
                    payments={
                      sortedPayments
                    }
                    sortColumn={
                      paymentSortColumn
                    }
                    onSort={
                      this
                        .handlePaymentSort
                    }
                  />
                )}
              </div>
            </div>
          )}

          {/* ==================================================
              CUSTOMER ENROLLMENTS
             ==================================================

              Existing Customers display one of four states:

              1. Loading
              2. API error
              3. No Enrollments
              4. Enrollments table

              Hidden on /customers/new because an unsaved
              Customer cannot yet have related Enrollments.
          */}

          {!isNewCustomer && (
            <div className="row mt-4">
              <div className="col-12">
                <h3>Enrollments</h3>

                {enrollmentsLoading ? (
                  <p>
                    Loading enrollments...
                  </p>
                ) : enrollmentsError ? (
                  <p>
                    {enrollmentsError}
                  </p>
                ) : enrollments.length ===
                  0 ? (
                  <p>
                    No enrollments recorded
                    for this student.
                  </p>
                ) : (
                  <EnrollmentTable
                    enrollments={
                      sortedEnrollments
                    }
                    sortColumn={
                      enrollmentSortColumn
                    }
                    onSort={
                      this
                        .handleEnrollmentSort
                    }
                  />
                )}
              </div>
            </div>
          )}

          {/* ==================================================
              SAVE / EXIT
             ==================================================

              Payments and Enrollments are displayed above
              the Customer form actions.
          */}

          <div className="text-right border-top">
            {this.renderButton(
              "Save"
            )}

            {this.renderLink(
              "/customers",
              "Exit"
            )}
          </div>
        </form>
      </div>
    );
  }
}

export default CustomerForm;