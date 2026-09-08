# Got Skills

Got Skills is a full-stack web application for managing students, course enrollments, products/courses, users, and payments.

The application uses a React frontend connected to a Node.js/Express REST API and MongoDB database. It provides a CRM-style interface for managing student records and the relationships between customers, enrollments, courses, and payment transactions.

## Features

### Student Management

Got Skills allows users to manage student/customer records, including:

- Student name
- Grade
- Email address
- Phone number
- Address
- Comments
- Active/inactive status

Users can create new student records and view or edit existing students.

### Payment History

Each existing student page includes the student's related payment history.

The application retrieves payments using the student's MongoDB `customerId` and displays them in a reusable payment table.

Payment information includes:

- Date and time
- Invoice
- Transaction
- Total amount
- Student
- Course
- Payment gateway
- Gateway transaction ID
- Full-payment status

The payment table supports column sorting.

Students with no payments display:

> No payments recorded for this student.

The Payments section is hidden when creating a new student because the student does not yet have an ID to which payments can be associated.

Payment loading and API errors are handled separately from the main student record, allowing student details to remain available if payment retrieval fails.

### Enrollments

The application manages student enrollments and connects payment records to enrollments.

Payment records contain an `enrollmentId`, allowing payment and invoice information to be associated with the appropriate enrollment.

### Payments

Payments contain information such as:

- Customer ID
- Enrollment ID
- Student name
- Product/course code
- Invoice
- Product description
- Gross amount
- Net amount
- Fee amount
- Transaction date
- Payment method
- Service provider
- Service-provider transaction ID
- Merchant ID
- Payment status
- Full-payment status
- Confirmation email address
- Transaction signature

The application includes PayFast-related payment fields and uses MongoDB `Decimal128` values for monetary amounts.

### Authentication

Protected API routes use JSON Web Token (JWT) authentication.

The frontend sends the authentication token using the:

```text
x-auth-token
```

HTTP header.

The Express backend validates the token through authentication middleware before allowing access to protected resources.

## Technology Stack

### Frontend

- React
- JavaScript
- React Router
- Axios
- Bootstrap
- Joi Browser
- Lodash
- React Toastify
- Font Awesome

### Backend

- Node.js
- Express
- Mongoose
- Joi
- JSON Web Tokens (JWT)
- Moment.js

### Database

- MongoDB

MongoDB ObjectIds are used to establish relationships between records such as customers, enrollments, and payments.

## Architecture

Got Skills follows a client-server architecture:

```text
React Frontend
      |
      | HTTP / REST
      v
Node.js + Express API
      |
      | Mongoose
      v
MongoDB
```

The frontend separates API communication into service modules.

For example:

```text
CustomerForm
     |
     +---- customerService
     |         |
     |         +---- GET customer
     |         +---- SAVE customer
     |
     +---- paymentService
               |
               +---- GET payments by customer ID
```

This keeps HTTP communication separate from presentation and form logic.

## Customer Payment Architecture

The student payment-history feature follows this flow:

```text
Customer page
/customers/:id
        |
        v
CustomerForm
        |
        +------------------------+
        |                        |
        v                        v
populateCustomer()       populatePayments()
        |                        |
        v                        v
getCustomer(id)       getPaymentsByCustomerId(id)
        |                        |
        v                        v
Customer API             Payment API
                                 |
                                 v
                   /payments/customer/:customerId
                                 |
                                 v
                        Payment.find(...)
                                 |
                                 v
                              MongoDB
```

Customer information and payment information are kept in separate component state:

```javascript
this.state.data
```

contains editable customer fields, while:

```javascript
this.state.payments
```

contains the related payment records.

This prevents related payment records from becoming part of the customer form payload.

## Customer Payment API

Payments for a particular customer can be retrieved using:

```http
GET /api/payments/customer/:customerId
```

The backend validates that `customerId` is a valid MongoDB ObjectId before querying the database.

Conceptually:

```javascript
const payments = await Payment.find({
  customerId: customerId,
}).sort("-transactionDate");
```

A successful request returns an array of payment records.

A customer without payments returns:

```json
[]
```

rather than an error.

## Payment Data Model

A payment is associated with both a customer and an enrollment:

```javascript
customerId: {
  type: mongoose.ObjectId,
  required: true,
},

enrollmentId: {
  type: mongoose.ObjectId,
  required: true,
},
```

These references allow payment records to be retrieved for individual students and linked to the appropriate enrollment.

Monetary values use MongoDB `Decimal128`:

```javascript
grossAmount: mongoose.Decimal128
netAmount: mongoose.Decimal128
feeAmount: mongoose.Decimal128
```

The frontend converts these values into displayable numbers before rendering them.

## Payment Table

The reusable `PaymentsTable` component displays payment records using the following mappings:

| Display Column | Payment Data |
| --- | --- |
| Date/Time | `transactionDate` |
| Invoice | `productInvoice` |
| Transaction | Derived from `enrollmentId` |
| Total R. | `grossAmount` |
| Student | `name` |
| Course | `productCode` |
| GW | `serviceProvider` |
| GW Transaction | `spTransactionId` |
| Full Paid | `isFullPayment` |

The payment table supports ascending and descending sorting through the existing reusable table components.

## Payment UI States

The customer page deliberately distinguishes between several payment states.

### Loading

```text
Loading payments...
```

### API Error

```text
Unable to load payments.
```

The customer record remains visible when the payment request fails.

### No Payments

```text
No payments recorded for this student.
```

### Payments Available

The reusable `PaymentsTable` component is displayed with all payments belonging to the current customer.

## Data Consistency

The Payment schema defines:

```javascript
customerId: mongoose.ObjectId
```

Legacy payment records originally contained a mixture of string and ObjectId values for `customerId`.

These records were normalized so that payment/customer relationships consistently use MongoDB ObjectIds.

This is important because MongoDB treats:

```javascript
"653c13b19107cf006c530ca8"
```

and:

```javascript
ObjectId("653c13b19107cf006c530ca8")
```

as different BSON values.

## Validation

Customer input is validated using Joi before submission.

Validation includes fields such as:

- Name
- Phone number
- Email
- Grade
- Address
- Comments
- Active status

The shared form component prevents submission while validation errors remain.

## Error Handling

The application handles errors at both frontend and backend levels.

Examples include:

- Invalid MongoDB ObjectIds
- Missing authentication
- Invalid JWTs
- Missing records
- Validation errors
- Server errors
- Payment API failures

React Toastify is used for user-facing notifications in several application workflows.

## Project Structure

The project is divided into separate backend and frontend applications.

```text
Got Skills
|
+-- javascript/
    |
    +-- nodejs/
    |   |
    |   +-- nodejs-packs-endpoint/
    |       |
    |       +-- models/
    |       +-- routes/
    |       +-- startup/
    |
    +-- react/
        |
        +-- react-packs-app/
            |
            +-- src/
                |
                +-- components/
                +-- services/
                +-- config/
```

The parent repository tracks the frontend and backend repositories as Git submodules.

## Running the Application

### Prerequisites

Install:

- Node.js
- npm
- MongoDB

Clone the project and ensure its Git submodules are initialized.

### Backend

Navigate to the backend application:

```bash
cd javascript/nodejs/nodejs-packs-endpoint
```

Install dependencies:

```bash
npm install
```

Start the backend using the startup command configured by the project.

The development API used by the project runs on:

```text
http://localhost:5030/api
```

### Frontend

Navigate to the React application:

```bash
cd javascript/react/react-packs-app
```

Install dependencies:

```bash
npm install
```

Start the React development application using the script configured in `package.json`.

## Testing the Customer Payment Feature

The payment-history functionality was tested against several database scenarios:

| Scenario | Expected Behaviour |
| --- | --- |
| Customer with multiple payments | All matching payments displayed |
| Customer with one payment | One table row displayed |
| Customer with no payments | Empty-state message displayed |
| Invalid customer ID | API rejects invalid ObjectId |
| Matching payment `customerId` | Payment displayed |
| Non-matching `customerId` | Payment excluded |
| Navigate between customers | Payment table updates for current customer |
| Payment API failure | Customer details remain visible |

The implementation was also tested directly against the REST API before frontend integration.

## Development Lessons

Development of the customer payment-history feature involved working across the complete full-stack request lifecycle:

```text
React component
      ↓
Frontend service
      ↓
Axios HTTP request
      ↓
Express route
      ↓
Authentication middleware
      ↓
Mongoose query
      ↓
MongoDB
      ↓
JSON response
      ↓
React state
      ↓
Rendered table
```

A particularly important debugging issue involved inconsistent MongoDB BSON types. Although several payment records contained visually identical customer IDs, some were stored as strings while others were stored as ObjectIds.

This demonstrated the importance of checking database types rather than assuming visually identical values are equivalent.

## Future Improvements

Potential future improvements include:

- Automated backend API tests
- React component tests for payment states
- Improved payment-table responsiveness
- Centralized payment formatting utilities
- More consistent error handling across services
- Additional validation of database relationships
- Pagination for customers with large payment histories
- Further modernization of older React class components where appropriate
- Additional documentation of the enrollment and payment workflows

## Repository

This project is maintained as part of the Got Skills application development work.

The codebase contains separate Node.js backend and React frontend repositories managed through a parent Git repository.

## Author

**Benjamin Klass**

Full-stack development work involving React, Node.js, Express, MongoDB, REST APIs, authentication, CRM-style data management, and payment/customer integration.
