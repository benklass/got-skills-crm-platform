import React from "react";
import { toast } from "react-toastify";

import Joi from "joi-browser";
import Form from "./common/form";

import { getCustomer } from "../services/customerService";
import { getProduct } from "../services/productService";
import { savePayment } from "../services/paymentService";

class PaymentForm extends Form {
  state = { data: {}, errors: {}, capturePaymentSelected: false };

  // Validation using Joi for new payment
  schema = {
    m_payment_id: Joi.string().required(), // enrollmentId
    custom_str1: Joi.string().required(), // customerId
    name_first: Joi.string().min(5).max(50).required(), // name
    custom_str2: Joi.string().min(5).max(25).required(), // productCode
    item_name: Joi.string().required(), // invoiceNo
    item_description: Joi.string().min(5).max(50).required(), // productCode + course
    email_address: Joi.string().min(5).max(50).email().required(), // customer email
    amount_gross: Joi.number().min(0).required(), // enrollmentFee
    amount_net: Joi.number().min(0).required(), // calculated
    amount_fee: Joi.number().min(0).required(), // calculated
    pf_payment_id: Joi.string()
      .min(5)
      .max(50)
      .not("TransactionNumber")
      .required()
      .label("Enter Transaction Number"), // spTransactionId captured
    custom_str3: Joi.string()
      .min(2)
      .max(50)
      .not("ServiceProvider")
      .required()
      .label("Enter Service Provider"), // serviceProvider captured
    //custom_str4: Joi.string().max(24).required(), // productId
    merchant_id: Joi.string().min(1).max(50).required(), // merchantId "0" for GoSkills
    payment_status: Joi.string().min(2).max(50).required(), // paymentStatus "COMPLETE" default
    signature: Joi.string().min(2).max(50).optional(), // signature for validation
  };

  // Set Payment properties

  /**
   * This function populates state data, student data, and product data in a React component after it
   * mounts.
   */
  async componentDidMount() {
    await this.populateStateData();
    await this.populateStudent();
    await this.populateProduct();
  }

  async populateStateData() {
    const data = this.props.location.state;

    this.setState({ ...data }, () => {
      //console.log("here in paymentForm - state :", this.state, checkDate);
    });
  }

  async populateStudent() {
    try {
      const { data: student } = await getCustomer(this.state.data.customerId);
      this.setState({ student }, () => {
        console.log("here in paymentForm - state Student:", this.state);
      });
    } catch (ex) {
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
    }
  }

  /* The above code is defining an asynchronous function called `populateProduct()`. Within this
  function, it is making an API call to retrieve product data using the `getProduct()` function with
  the `productId` stored in the component's state. If the API call is successful, the retrieved
  product data is stored in the component's state using `setState()`. If there is an error with the
  API call, the code handles the error by displaying an appropriate error message using the `toast`
  library. */
  async populateProduct() {
    try {
      const { data: product } = await getProduct(this.state.data.productId);
      this.setState({ product }, () => {
        // console.log("here in paymentForm - state Product :", this.state);
      });
    } catch (ex) {
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
    }
  }

  // DA 22 05 2023 Added for PayFast online payments
  // TODO create a component to call here
  renderPayFastButton() {
    const payAmount = Math.round(this.state.data.enrollmentFee).toFixed(2);
    const enrollmentId = this.state.data._id; // To display the enrollment
    const payFastServer = "https://sandbox.payfast.co.za/eng/process";

    // const restUrl = "http://178.62.84.58:5005"; // Backend
    // const respondUrl = "http://178.62.84.58:3005"; // Frontend
    const restUrl = "https://daunting-jumbo-quickly.ngrok-free.dev"; // Backend
    const respondUrl = "https://dbef-185-246-211-74.ngrok-free.app"; // Frontend

    const merchantId = "10029518";
    const itemName = this.state.data.invoiceNo;
    const itemDescription =
      this.state.product.productCode + " : " + this.state.data.course;
    const returnUrl = respondUrl + "/enrollments/" + enrollmentId;
    const cancelUrl = respondUrl + "/enrollments/" + enrollmentId;
    const notifyUrl = restUrl + "/api/payments";
    const confirmationAddress = "dave@daconsulting.co.za";
    const customStr1 =
      this.state.student !== undefined
        ? this.state.student._id
        : "Student missing";
    const customStr2 =
      this.state.product !== undefined
        ? this.state.product.productCode
        : "Product Missing";
    const customStr3 = "PayFast";

    const nameFirst = this.state.data.name;

    return (
      <form name="PayFastPayNowForm" action={payFastServer} method="post">
        <input required type="hidden" name="cmd" value="_paynow"></input>
        <input
          required
          type="hidden"
          name="receiver"
          pattern="[0-9]"
          value={merchantId}
        ></input>
        <input type="hidden" name="return_url" value={returnUrl}></input>
        <input type="hidden" name="cancel_url" value={cancelUrl}></input>
        <input type="hidden" name="notify_url" value={notifyUrl}></input>

        <input type="hidden" name="m_payment_id" value={enrollmentId}></input>
        <input required type="hidden" name="amount" value={payAmount}></input>
        <input
          required
          type="hidden"
          name="item_name"
          maxLength="255"
          value={itemName}
        ></input>
        <input
          required
          type="hidden"
          name="item_description"
          maxLength="255"
          value={itemDescription}
        ></input>
        <input type="hidden" name="email_confirmation" value="1"></input>
        <input
          type="hidden"
          name="email_address"
          value={confirmationAddress}
        ></input>
        <input type="hidden" name="custom_str1" value={customStr1}></input>
        <input type="hidden" name="custom_str2" value={customStr2}></input>
        <input type="hidden" name="custom_str3" value={customStr3}></input>

        <input type="hidden" name="name_first" value={nameFirst}></input>
        <input
          className="btn btn-primary mt-2 mr-2 text-right"
          type="image"
          alt="Pay Now with PayFast"
          title="Pay Now with Payfast"
        ></input>
      </form>
    );
  }

  /* The code is a JavaScript function that takes in an object called `sentData` as a parameter.
 It calculates the `amount_net` and `amount_fee` based on the `enrollmentFee` property of the
 `sentData` object and a fixed percentage value of 2.3. It then returns an object with various
 properties such as `merchant_id`, `m_payment_id`, `amount_gross`, `amount_net`, `amount_fee`,
 `item_name`, `item_description`, `email_address`, `custom_str1`, `custom_str2`, `custom_str3`, ` */
  populateManualPaymentData = (sentData) => {
    const data = sentData;
    const amountFeePercent = 2.3;
    const amount_net = data.data.enrollmentFee * (1 - amountFeePercent / 100);
    const amount_fee = data.data.enrollmentFee - amount_net;

    return {
      merchant_id: "01",
      m_payment_id: data.data._id,
      amount_gross: data.data.enrollmentFee,
      amount_net,
      amount_fee,
      item_name: data.data.invoiceNo.toString(),
      item_description: data.product.productCode + " : " + data.data.course,

      email_address: data.student.email,
      custom_str1: data.data.customerId,
      custom_str2: data.product.productCode,
      custom_str3: "ServiceProvider", // Get user to enter this propery

      name_first: data.data.name,
      pf_payment_id: "TransactionNumber", // Get user to enter this property
      payment_status: "COMPLETE",
      signature: "future use",
    };
  };

  async doSubmit() {
    if (this.state.capturePaymentSelected === true) {
      this.setState({ capturePaymentSelected: false });
      const payment = this.state.data;

      try {
        const responseData = await savePayment(payment);
        console.log("Here in paymentForm.jsx - doSubmit : responseData ");
        this.setState({ receipt: responseData });
      } catch (ex) {
        switch (ex.response.status) {
          case 400:
            toast.error(ex.response.data + " Correct Input");
            break;
          case 500:
            toast.error(ex.response.data);
            this.props.history.goBack();
            break;
          default:
            toast.error("savePayment : Unspecified Error Occured");
            this.props.history.goBack();
        }
      }
    }
  }

  // Added onClick to handle manual payments
  async doClick() {
    if (this.state.capturePaymentSelected === false) {
      this.setState({ capturePaymentSelected: true });
      const data = this.state;
      const paymentData = this.populateManualPaymentData(data);

      console.log("Here in paymentForm.jsx - doClick : ", paymentData);
      this.setState({ data: paymentData });
    }
  }

  render() {
    const data = this.state;
    const capturePayment = this.state.capturePaymentSelected;
    console.log("here in paymentForm - render: ", data);
    return data.product ? (
      <div>
        <h1>Payment Form</h1>
        <form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              {capturePayment === false
                ? this.renderInputReadOnly("name", "Student")
                : this.renderInputReadOnly("first_name", "Student")}
              {capturePayment === false
                ? this.renderInputReadOnly("invoiceNo", "Invoice")
                : this.renderInputReadOnly("item_name", "Invoice")}
              {capturePayment === false
                ? this.renderInputReadOnly("course", "Course")
                : this.renderInputReadOnly("item_description", "Course")}
              <div className="row">
                <div className="col-md-6">
                  {this.state.student !== undefined
                    ? this.renderStatePropertyReadOnly(
                        this.state.student.email,
                        "email",
                        "Email"
                      )
                    : null}
                  {capturePayment === true
                    ? this.renderInput("custom_str3", "Bank")
                    : null}
                </div>
                <div className="col-md-6">
                  {capturePayment === false
                    ? this.renderInputReadOnly("enrollmentFee", "Total Amount")
                    : this.renderInputReadOnly("amount_gross", "Total Amount")}
                  {capturePayment === true
                    ? this.renderInput("pf_payment_id", "Transaction Number")
                    : null}
                </div>
              </div>

              <div>
                <table className="table text-right .table-responsive-sm border-top">
                  <tbody>
                    <tr>
                      <td className="text-right">
                        {this.state.data.enrollmentPaid === false &&
                        this.state.student !== undefined &&
                        this.state.capturePaymentSelected === false
                          ? this.renderPayFastButton()
                          : null}
                      </td>

                      <td className="text-right">
                        {this.state.data.enrollmentPaid === false &&
                        this.state.student !== undefined
                          ? this.renderReturnButton("Capture Payment")
                          : null}
                        {capturePayment === true
                          ? this.renderButton("Save Payment")
                          : null}
                        {this.renderLink("/enrollments", "Exit")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div></div>
          </div>
        </form>
      </div>
    ) : (
      <div>
        <span>Loading Data ....</span>
      </div>
    );
  }
}

export default PaymentForm;
