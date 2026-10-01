import React from "react";
import { toast } from "react-toastify";

import Joi from "joi-browser";
import Form from "./common/form";

import { getCustomers } from "../services/customerService";
import { getProducts } from "../services/productService";
import { getEnrollment } from "../services/enrollmentService";
import { completeEnrollment } from "../services/completionService";

import { Link } from "react-router-dom";

class CompleteEnrollmentForm extends Form {
  // Stores the enrollment data displayed on the Completion Form,
  // along with customer/product lookup lists and validation errors.
  state = {
    data: {
      _id: "",
      customerId: "",
      name: "",
      productId: "",
      course: "",
      phone: "",
      startDate: "",
      endDate: "",
      productPrice: "",
      enrollmentDate: "",
      enrollmentFee: "",
      completionDate: "",
      enrollmentPaid: "",
      invoiceNo: "",
    },
    customers: [],
    products: [],
    errors: {},
  };

  // Joi validation schema for the enrollment completion form.
  schema = {
    _id: Joi.string(),

    customerId: Joi.string()
      .required()
      .label("Student"),

    name: Joi.string()
      .label("Student"),

    productId: Joi.string()
      .required()
      .label("Course"),

    course: Joi.string(),

    productPrice: Joi.number()
      .integer()
      .required()
      .min(0)
      .max(99999)
      .label("Course Fee"),

    phone: Joi.string()
      .min(7)
      .max(16)
      .regex(
        /^(\d{3}-\d{3}-\d{4}$)/,
        "Number format 999-999-9999 "
      )
      .required()
      .label("Phone"),

    startDate: Joi.date()
      .required()
      .label("Start Date"),

    endDate: Joi.date()
      .required()
      .label("End Date"),

    enrollmentDate: Joi.date()
      .required()
      .label("Enrollment Date"),

    enrollmentFee: Joi.number()
      .required()
      .label("Enrollment Fee"),

    completionDate: Joi.date()
      .label("Completion Date"),

    enrollmentPaid: Joi.boolean(),

    invoiceNo: Joi.date().optional(),
  };

  // Loads all customers used by the Completion Form.
  async populateCustomers() {
    const { data: customers } = await getCustomers();

    this.setState({ customers });
  }

  // Loads available products/courses and maps the product name
  // to the "course" field expected by the form.
  async populateProducts() {
    const { data: products } = await getProducts();

    const updatedProducts = products
      .filter((product) => product.numberInStock >= 1)
      .map((product) => {
        return {
          ...product,
          course: product.name,
        };
      });

    this.setState({
      products: updatedProducts,
    });
  }

  // Loads the enrollment identified by the route parameter
  // and maps it into the format used by the Completion Form.
  async populateEnrollmentCompletion() {
    try {
      const enrollmentId =
        this.props.match.params.id;

      if (enrollmentId === "new") return;

      const { data: enrollment } =
        await getEnrollment(enrollmentId);

      this.setState({
        data: this.mapToViewModel(enrollment),
      });
    } catch (ex) {
      switch (ex.response.status) {
        case 404:
          toast.error(ex.response.data);
          break;

        case 500:
          toast.error(ex.response.data);
          break;

        default:
          toast.error(
            "completionForm : Unspecified Error Occured"
          );
      }

      this.props.history.replace("/not-found");
    }
  }

  // Loads the supporting customer/product data and the current
  // enrollment when the Completion Form first mounts.
  async componentDidMount() {
    await this.populateCustomers();
    await this.populateProducts();
    await this.populateEnrollmentCompletion();
  }

  // Maps the Enrollment document returned by the backend
  // into the flat data structure expected by the form.
  mapToViewModel(enrollment) {
    const startDate = new Date(
      enrollment.product.startDate
    ).toLocaleDateString("en-ZA");

    const endDate = new Date(
      enrollment.product.endDate
    ).toLocaleDateString("en-ZA");

    const formatEnrollmentDate =
      new Date(
        enrollment.enrollmentDate
      ).toLocaleDateString("en-ZA");

    const formatCompletionDate =
      enrollment.completionDate
        ? new Date(
            enrollment.completionDate
          ).toLocaleDateString("en-ZA")
        : new Date("1970").toISOString();

    return {
      _id: enrollment._id,

      customerId:
        enrollment.customer._id,

      name:
        enrollment.customer.name,

      phone:
        enrollment.customer.phone,

      productId:
        enrollment.product._id,

      course:
        enrollment.product.name,

      startDate,

      endDate,

      productPrice:
        enrollment.product.productPrice
          .$numberDecimal,

      enrollmentDate:
        formatEnrollmentDate,

      completionDate:
        formatCompletionDate,

      enrollmentFee:
        enrollment.enrollmentFee
          .$numberDecimal,

      enrollmentPaid:
        enrollment.enrollmentPaid,

      // Retained for compatibility with the form.
      // The refactored enrollmentPrint page now recreates the
      // invoice number from enrollment.enrollmentDate itself.
      invoiceNo:
        new Date(
          enrollment.enrollmentDate
        ).getTime(),
    };
  }

  // Completes the current enrollment on the backend
  // and updates the form with the returned completion data.
  doCompletion = async () => {
    try {
      const completionData =
        await completeEnrollment(
          this.state.data._id,
          this.state.data.customerId,
          this.state.data.productId
        );

      this.setState({
        data: {
          ...this.state.data,

          completionDate:
            completionData.data
              .completionDate,

          enrollmentFee:
            completionData.data
              .enrollmentFee
              .$numberDecimal,

          enrollmentPaid:
            completionData.data
              .enrollmentPaid,
        },
      });
    } catch (ex) {
      if (ex.response) {
        switch (ex.response.status) {
          case 400:
            toast.error(ex.response.data);
            break;

          case 401:
            toast.error(ex.response.data);
            break;

          case 404:
            toast.error(ex.response.data);
            break;

          case 403:
            toast.error(ex.response.data);
            break;

          default:
            toast.error(
              "A Unspecified Error occured.",
              ex.response.data
            );
        }
      }
    }
  };

  // Called by the shared Form submission handler.
  async doSubmit() {
    await this.doCompletion();
  }

  // Existing click handler retained from the original component.
  handleOnClick() {
    console.log(
      "here in completionForm - handlePayment : do something"
    );
  }

  render() {
    return (
      <div>
        <h1>Completion Form</h1>

        <form
          onSubmit={this.handleSubmit}
          onClick={this.handleOnClick}
        >
          <div className="row">
            <div className="col-md-6">
              {this.renderInputReadOnly(
                "name",
                "Student"
              )}

              {this.renderInputReadOnly(
                "phone",
                "Phone"
              )}

              {this.renderInputReadOnly(
                "course",
                "Course"
              )}

              <div className="row">
                <div className="col-md-6">
                  {this.renderInputReadOnly(
                    "startDate",
                    "Start"
                  )}
                </div>

                <div className="col-md-6">
                  {this.renderInputReadOnly(
                    "endDate",
                    "End"
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="row">
                <div className="col-md-6">
                  {this.renderInputReadOnly(
                    "enrollmentDate",
                    "Enroll Date"
                  )}
                </div>

                <div className="col-md-6">
                  {this.renderInputReadOnly(
                    "enrollmentFee",
                    "Enroll Fee"
                  )}
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  {this.renderInputReadOnly(
                    "productPrice",
                    "Course Fee"
                  )}
                </div>

                <div className="col-md-6">
                  {this.renderInputReadOnly(
                    "enrollmentPaid",
                    "Fee Paid"
                  )}
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  {this.state.data
                    .completionDate >
                  new Date(
                    "1970"
                  ).toISOString()
                    ? this.renderInputReadOnly(
                        "completionDate",
                        "Completed Date"
                      )
                    : null}
                </div>
              </div>

              <div className="text-right border-top">
                {/* Displays Pay Now only for an unpaid enrollment. */}
                {this.state.data
                  .enrollmentPaid === false ? (
                  <Link
                    className="btn btn-primary mt-2 mr-2"
                    to={{
                      pathname:
                        "/paymentForm",
                      state: {
                        ...this.state,
                      },
                    }}
                  >
                    Pay Now
                  </Link>
                ) : null}

                {/* Displays Complete only while the enrollment
                    has not yet received a completion date. */}
                {this.state.data
                  .completionDate ===
                new Date(
                  "1970"
                ).toISOString()
                  ? this.renderReturnButton(
                      "Complete"
                    )
                  : null}

                {/* Opens the Invoice PDF page.
                    After the refactor, only the enrollment ID is
                    passed. enrollmentPrint.jsx retrieves all other
                    data required to build the invoice itself. */}
                <Link
                  className="btn btn-primary mt-2 mr-2"
                  to={{
                    pathname:
                      "/enrollmentPrint",
                    state: {
                      enrollmentId:
                        this.state.data._id,
                    },
                  }}
                >
                  Invoice
                </Link>

                {/* Opens the Receipt PDF page for a paid enrollment.
                    Only the enrollment ID is passed; receiptPrint.jsx
                    uses it to retrieve the associated payment. */}
                {this.state.data
                  .enrollmentPaid === true ? (
                  <Link
                    className="btn btn-primary mt-2 mr-2"
                    to={{
                      pathname:
                        "/receiptPrint",
                      state: {
                        enrollmentId:
                          this.state.data._id,
                      },
                    }}
                  >
                    Receipt
                  </Link>
                ) : null}

                {this.renderLink(
                  "/enrollments",
                  "Exit"
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default CompleteEnrollmentForm;