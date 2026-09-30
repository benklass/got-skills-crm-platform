# Got Skills

Got Skills is a full-stack CRM web application for managing students,
courses, enrollments, payments, and related calendar activity.

The application uses a React frontend connected to a Node.js/Express
REST API and MongoDB database. It provides a CRM-style interface for
managing student records and the relationships between customers,
enrollments, courses, and payment transactions.

## Features

### Student Management

Got Skills allows users to manage student/customer records, including:

-   Student name
-   Grade
-   Email address
-   Phone number
-   Address
-   Comments
-   Active/inactive status

Users can create new student records and view or edit existing students.

### Payment History

Each existing student page includes the student's related payment
history.

The application retrieves payments using the student's MongoDB
`customerId` and displays them in a reusable payment table.

Payment information includes:

-   Date and time
-   Invoice
-   Transaction
-   Total amount
-   Student
-   Course
-   Payment gateway
-   Gateway transaction ID
-   Full-payment status

The payment table supports column sorting.

Students with no payments display:

> No payments recorded for this student.

The Payments section is hidden when creating a new student because the
student does not yet have an ID to which payments can be associated.

Payment loading and API errors are handled separately from the main
student record, allowing student details to remain available if payment
retrieval fails.

### Enrollments

The application manages student enrollments and connects payment records
to enrollments. Existing student record pages also display the
enrollments associated with that student, using the student's customer
ID.

Payment records contain an `enrollmentId`, allowing payment and invoice
information to be associated with the appropriate enrollment.

### Payments

Payments contain information such as:

-   Customer ID
-   Enrollment ID
-   Student name
-   Product/course code
-   Invoice
-   Product description
-   Gross amount
-   Net amount
-   Fee amount
-   Transaction date
-   Payment method
-   Service provider
-   Service-provider transaction ID
-   Merchant ID
-   Payment status
-   Full-payment status
-   Confirmation email address
-   Transaction signature

The application includes PayFast-related payment fields and uses MongoDB
`Decimal128` values for monetary amounts.

### Authentication

Protected API routes use JSON Web Token (JWT) authentication.

The frontend sends the authentication token using the:

``` text
x-auth-token
```

HTTP header.

The Express backend validates the token through authentication
middleware before allowing access to protected resources.

## Technology Stack

### Frontend

-   React
-   JavaScript
-   React Router
-   Axios
-   Bootstrap
-   Joi Browser
-   Lodash
-   React Toastify
-   Font Awesome
-   React Big Calendar and Moment.js (calendar views and date
    localization)
-   React PDF (`@react-pdf/renderer`) for invoice and receipt
    viewing/downloads

### Backend

-   Node.js
-   Express
-   Mongoose
-   Joi
-   JSON Web Tokens (JWT)
-   Moment.js

### Database

-   MongoDB

MongoDB ObjectIds are used to establish relationships between records
such as customers, enrollments, and payments.

## Architecture

Got Skills follows a client-server architecture:

``` text
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

``` text
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

``` text
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

Customer information and payment information are kept in separate
component state:

``` javascript
this.state.data
```

contains editable customer fields, while:

``` javascript
this.state.payments
```

contains the related payment records.

This prevents related payment records from becoming part of the customer
form payload.

## Customer Payment API

Payments for a particular customer can be retrieved using:

``` http
GET /api/payments/customer/:customerId
```

The backend validates that `customerId` is a valid MongoDB ObjectId
before querying the database.

Conceptually:

``` javascript
const payments = await Payment.find({
  customerId: customerId,
}).sort("-transactionDate");
```

A successful request returns an array of payment records.

A customer without payments returns:

``` json
[]
```

rather than an error.

## Payment Data Model

A payment is associated with both a customer and an enrollment:

``` javascript
customerId: {
  type: mongoose.ObjectId,
  required: true,
},

enrollmentId: {
  type: mongoose.ObjectId,
  required: true,
},
```

These references allow payment records to be retrieved for individual
students and linked to the appropriate enrollment.

Monetary values use MongoDB `Decimal128`:

``` javascript
grossAmount: mongoose.Decimal128
netAmount: mongoose.Decimal128
feeAmount: mongoose.Decimal128
```

The frontend converts these values into displayable numbers before
rendering them.

## Payment Table

The reusable `PaymentsTable` component displays payment records using
the following mappings:

  Display Column   Payment Data
  ---------------- -----------------------------
  Date/Time        `transactionDate`
  Invoice          `productInvoice`
  Transaction      Derived from `enrollmentId`
  Total R.         `grossAmount`
  Student          `name`
  Course           `productCode`
  GW               `serviceProvider`
  GW Transaction   `spTransactionId`
  Full Paid        `isFullPayment`

The payment table supports ascending and descending sorting through the
existing reusable table components.

## Payment UI States

The customer page deliberately distinguishes between several payment
states.

### Loading

``` text
Loading payments...
```

### API Error

``` text
Unable to load payments.
```

The customer record remains visible when the payment request fails.

### No Payments

``` text
No payments recorded for this student.
```

### Payments Available

The reusable `PaymentsTable` component is displayed with all payments
belonging to the current customer.

## Data Consistency

The Payment schema defines:

``` javascript
customerId: mongoose.ObjectId
```

Legacy payment records originally contained a mixture of string and
ObjectId values for `customerId`.

These records were normalized so that payment/customer relationships
consistently use MongoDB ObjectIds.

This is important because MongoDB treats:

``` javascript
"653c13b19107cf006c530ca8"
```

and:

``` javascript
ObjectId("653c13b19107cf006c530ca8")
```

as different BSON values.

## Validation

Customer input is validated using Joi before submission.

Validation includes fields such as:

-   Name
-   Phone number
-   Email
-   Grade
-   Address
-   Comments
-   Active status

The shared form component prevents submission while validation errors
remain.

## Error Handling

The application handles errors at both frontend and backend levels.

Examples include:

-   Invalid MongoDB ObjectIds
-   Missing authentication
-   Invalid JWTs
-   Missing records
-   Validation errors
-   Server errors
-   Payment API failures

React Toastify is used for user-facing notifications in several
application workflows.

## Project Structure

The project is divided into separate backend and frontend applications.

``` text
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

The parent repository tracks the frontend and backend repositories as
Git submodules. Commit frontend changes in the frontend repository and
push its current branch before updating and committing the parent
repository's submodule reference.

## Running the Application

### Prerequisites

Install:

-   Node.js
-   npm
-   MongoDB

Clone the project and ensure its Git submodules are initialized.

### Backend

Navigate to the backend application:

``` bash
cd javascript/nodejs/nodejs-packs-endpoint
```

Install dependencies:

``` bash
npm install
```

Start the backend using the startup command configured by the project.

The development API used by the project runs on:

``` text
http://localhost:5030/api
```

### Frontend

Navigate to the React application:

``` bash
cd javascript/react/react-packs-app
```

Install dependencies:

``` bash
npm install
```

Start the React development application using the script configured in
`package.json` (typically `npm start`). The development frontend
normally runs at `http://localhost:3000`. Configure the backend
connection and authentication environment according to the existing
project setup.

## Testing the Customer Payment Feature

The payment-history functionality was tested against several database
scenarios:

  ---------------------------------------------------------------------
  Scenario                           Expected Behaviour
  ---------------------------------- ----------------------------------
  Customer with multiple payments    All matching payments displayed

  Customer with one payment          One table row displayed

  Customer with no payments          Empty-state message displayed

  Invalid customer ID                API rejects invalid ObjectId

  Matching payment `customerId`      Payment displayed

  Non-matching `customerId`          Payment excluded

  Navigate between customers         Payment table updates for current
                                     customer

  Payment API failure                Customer details remain visible
  ---------------------------------------------------------------------

The implementation was also tested directly against the REST API before
frontend integration.

## Development Lessons

Development of the customer payment-history feature involved working
across the complete full-stack request lifecycle:

``` text
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

A particularly important debugging issue involved inconsistent MongoDB
BSON types. Although several payment records contained visually
identical customer IDs, some were stored as strings while others were
stored as ObjectIds.

This demonstrated the importance of checking database types rather than
assuming visually identical values are equivalent.

## Future Improvements

Potential future improvements include:

-   Automated backend API tests
-   React component tests for payment states
-   Improved payment-table responsiveness
-   Centralized payment formatting utilities
-   More consistent error handling across services
-   Additional validation of database relationships
-   Pagination for customers with large payment histories
-   Further modernization of older React class components where
    appropriate
-   Additional documentation of the enrollment and payment workflows
-   Automated tests for calendar date-range totals and record navigation

## Student Record Enrollment History

The existing student/customer record page displays enrollments belonging
to that student, alongside the student details and related payment
history. The frontend retrieves records by customer ID through
`getEnrollmentsByCustomerId(customerId)`, backed by
`GET /api/enrollments/customer/:customerId`. Enrollment records embed
customer information, so the backend matches `customer._id` to the
requested customer ID. The list provides access to the corresponding
enrollment records.

## Dynamic CRM Calendar

The Calendar page (`/calendar`) is implemented in
`src/components/calendar.jsx`, registered in `src/App.js`, and linked
from `src/components/navBar.jsx`. It retrieves courses, payments, and
**all** enrollments through the existing frontend service modules and
displays them in React Big Calendar. Using all enrollments ensures that
completed or paid enrollments are not omitted merely because of their
status.

### Event categories and dates

  ------------------------------------------------------------------------------------------------
  Category     Source record and date     Event title   Color      Record link
  ------------ -------------------------- ------------- ---------- -------------------------------
  Course       Product                    Course name   Blue       `/products/:id`
               `startDate`--`endDate` +   and                      
               `startTime`--`endTime`     instructor               
                                          name                     

  Payment      Payment `transactionDate`  Payment,      Green      `/receiptPrint?paymentId=:id`
                                          student name,            
                                          and course               
                                          code when                
                                          available                

  Enrollment   Enrollment                 Enrollment,   Yellow     `/enrollments/:id`
               `enrollmentDate`           student name,            
                                          and course               
                                          name when                
                                          available                
  ------------------------------------------------------------------------------------------------

Course records use their stored date range together with `startTime` and
`endTime` to generate one timed event for each calendar day in the
Course range. Payment and enrollment records remain single-date events.
The event objects retain the source record ID and type for navigation
and display. Titles and color coding both identify event types, rather
than relying on color alone.

### View-dependent summary totals

The four summary cards display **Courses**, **Payments**,
**Enrollments**, and **Total Calendar Events** for the selected calendar
view:

  ---------------------------------------------------------------------
  View                               Counting period
  ---------------------------------- ----------------------------------
  Month                              Selected calendar month

  Week                               Selected calendar week, using the
                                     calendar's configured week start

  Day                                Selected day

  Agenda                             Agenda date range (30 days in the
                                     current implementation)
  ---------------------------------------------------------------------

A course counts **once per displayed period** if its start/end range
overlaps that period. For example, a course spanning September and
October contributes once to each month's totals and once to each
overlapping week; it is counted on each active day in Day view. Payments
count by transaction date and enrollments by enrollment date. The
combined total is the sum of the three category totals. The calendar
still renders the retrieved event collection; switching views changes
the summary period, not the underlying records.

### Event details and navigation

Selecting a calendar event opens a color-coded details pop-up. The
pop-up provides a link to its source CRM record in a **new browser
tab**, leaving the calendar open. Course and enrollment links open their
respective record pages. Payment links open the **specific payment
receipt**, not the general Payments list.

The receipt page accepts a direct URL containing the payment ID, for
example:

``` text
/receiptPrint?paymentId=PAYMENT_OBJECT_ID
```

`receiptPrint.jsx` reads the query parameter and retrieves the
corresponding payment through `getPayment(paymentId)`. It also retains
the existing React Router `location.state` paths used by the Payments
table (`paymentId`) and Completion Form (`enrollmentId`, resolved with
`getPaymentByEnrollmentId`). The existing PDF viewer and download link
are reused.

### Loading and error handling

The Calendar page distinguishes loading, empty, success, and
request-error states. Category-specific retrieval failures are reported
without requiring the entire calendar page to crash. Event dates must be
valid to contribute to the summary totals.

### Calendar verification checklist

-   Switch between Month, Week, Day, and Agenda and compare the summary
    period and counts with the displayed dates.
-   Check a course crossing month/week boundaries; confirm it counts
    once in each overlapping period.
-   Confirm a course appears on each applicable day in Day view without
    being counted twice within a single day.
-   Check payment and enrollment totals against their transaction and
    enrollment dates.
-   Verify event titles include the instructor or student name and event
    colors remain consistent across views.
-   Open each event type's pop-up and confirm the record link opens in a
    new tab.
-   Confirm a payment event opens the correct receipt and the existing
    Payments-table and Completion Form receipt paths still work.
-   Check empty datasets, missing/invalid dates, and an API failure in
    one category.

These are recommended regression checks; this README does not claim they
are automated tests.

## Calendar Time Extension

The CRM calendar has been extended from date-only Course ranges to
explicit daily Course schedules. Course/Product records now include
`startTime` and `endTime` in addition to `startDate` and `endDate`.

A Course schedule therefore has four components:

``` text
startDate
endDate
startTime
endTime
```

For example:

``` text
Start Date:  2026-10-01
End Date:    2026-10-31
Start Time:  08:00
End Time:    17:00
```

This represents a Course that runs from **08:00 until 17:00 on every
calendar day from 1 October through 31 October 2026**.

### Course Time Data

Course times are stored as zero-padded 24-hour `HH:mm` strings:

``` text
08:00
13:30
17:00
```

This format is used consistently by the Course form, calendar-event
generation, and enrollment conflict detection.

Existing Course records were designed to be backfilled with the default
schedule:

``` text
startTime = "08:00"
endTime   = "17:00"
```

so legacy date-only records can participate in the extended scheduling
model.

### Course Form

The Course/Product form now includes **Start Time** and **End Time**
controls alongside the existing Start Date and End Date fields.

The controls use native HTML time inputs:

``` jsx
{this.renderInput("startTime", "Start Time", "time")}
{this.renderInput("endTime", "End Time", "time")}
```

When an existing Course is edited, `mapToViewModel()` loads the stored
`startTime` and `endTime` values into the form. When the form is
submitted, the two fields are included in the existing Product payload
handled by `saveProduct()`.

### Course Time Validation

Course scheduling is validated before a Product can be saved.

Both time fields are required and must use valid 24-hour `HH:mm` format.
The frontend uses the following pattern:

``` javascript
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
```

Examples:

  Schedule            Result
  ------------------- ---------
  `08:00` → `17:00`   Valid
  `08:00` → `08:00`   Invalid
  `17:00` → `08:00`   Invalid
  `25:00` → `17:00`   Invalid

In addition to validating each field individually, the Course form
performs cross-field validation requiring:

``` text
endTime > startTime
```

Overnight Course schedules are therefore not supported by the current
implementation.

### Timed Calendar Events

Courses are no longer represented only as one date-range block. The
calendar expands each Course into a timed event for **every calendar
day** from `startDate` through `endDate`, including the final day.

Conceptually:

``` text
Course
  |
  +-- startDate
  +-- endDate
  +-- startTime
  +-- endTime
        |
        v
createDailyCourseEvents(course)
        |
        v
one timed React Big Calendar event per Course day
```

For a Course running from 1--3 October at 08:00--17:00, the calendar
produces:

``` text
1 Oct 08:00–17:00
2 Oct 08:00–17:00
3 Oct 08:00–17:00
```

The implementation combines each Course calendar date with its `HH:mm`
values using local wall-clock time. The `YYYY-MM-DD` part of the stored
Course date is treated as the intended calendar day rather than first
being shifted through timezone conversion. This avoids accidental date
changes around UTC/local-time boundaries.

Incomplete or malformed Course schedules are ignored by the
event-expansion helper rather than crashing the Calendar page.

Payments and enrollments retain their existing date-based calendar
behavior.

### Calendar Views and Totals

The existing Month, Week, Day, and Agenda views remain available. Course
events now carry real daily start/end times, allowing Week and Day views
in particular to show where a Course falls within the day's schedule.

The summary-card counting rule remains **Course-based rather than
generated-event-based**: a Course counts once for an overlapping
displayed period rather than once for every daily event generated from
that Course. This prevents a multi-day Course from artificially
inflating the Course total.

### Enrollment Course Times

The Enrollment form exposes the selected Course's schedule so the user
can see the dates and daily times involved in the enrollment decision.

The scheduling extension also adds student Course-conflict detection.
Conflict checking uses the selected student and Course, retrieves the
student's current enrollments, resolves those enrollments to the current
Course records, and compares their schedules.

A scheduling conflict exists only when **both** conditions are true:

1.  The Course date ranges overlap.
2.  The daily time ranges overlap.

The date comparison is inclusive:

``` javascript
const datesOverlap =
  newStartDate <= existingEndDate &&
  newEndDate >= existingStartDate;
```

The time comparison uses strict boundaries:

``` javascript
const timesOverlap =
  newCourse.startTime < existingCourse.endTime &&
  newCourse.endTime > existingCourse.startTime;
```

Therefore these schedules do **not** conflict:

``` text
Existing Course: 08:00–12:00
New Course:      12:00–16:00
```

because the first Course ends exactly when the second Course begins.

### Conflict Detection Flow

The enrollment scheduling check follows this flow:

``` text
Select Student + Course
        |
        v
retrieve student's enrollments
        |
        v
resolve each enrollment to current Course data
        |
        v
compare date ranges
        |
        v
compare daily time ranges
        |
        v
display any scheduling conflicts
```

Conflict checks use the complete current Course list rather than only
the active/in-stock Course dropdown. This is important because an
existing enrollment can refer to a Course that has since become inactive
or has no remaining stock.

Asynchronous conflict checks are versioned so that an older request
cannot overwrite the result for a newer Student/Course selection.

### Blocking Enrollment Conflict Policy

Course scheduling conflicts are now **blocking conditions**, rather than
warning-only conditions.

The Enrollment form continues to keep asynchronous scheduling state
separate from ordinary Joi validation through:

``` javascript
scheduleConflicts
conflictChecking
conflictCheckError
```

The **Enroll** button is disabled when any of the following is true:

-   ordinary form validation fails;
-   a known Course scheduling conflict exists;
-   conflict checking is still in progress; or
-   the conflict check failed and the application cannot establish that
    the selected schedule is safe.

The implementation therefore follows a **fail-closed** policy for
scheduling checks.

The application also rechecks the latest scheduling information
immediately before `saveEnrollment()` runs. If the latest conflict check
fails or returns one or more conflicts, `doEnrollment()` returns without
sending the enrollment POST request.

This provides two layers of protection:

``` text
disabled Enroll button
        +
final doEnrollment() conflict guard
```

A known scheduling conflict therefore cannot create an enrollment merely
by bypassing the visible button state.

### Calendar Time Extension Verification

Recommended regression checks include:

-   Create a Course with valid Start Time and End Time values and
    confirm they are saved and reloaded when editing.
-   Confirm missing or malformed `HH:mm` values fail Course validation.
-   Confirm an End Time equal to or earlier than Start Time is rejected.
-   Confirm a multi-day Course appears at the correct time on every
    calendar day in its range.
-   Confirm the final Course day is included.
-   Confirm Course dates are not shifted by timezone conversion.
-   Check Month, Week, Day, and Agenda views after the timed-event
    expansion.
-   Confirm summary totals count Courses rather than the number of
    generated daily Course events.
-   Select a student with an overlapping Course and confirm the conflict
    explanation appears and the Enroll button is disabled.
-   Confirm overlapping dates with non-overlapping times do not produce
    a conflict.
-   Confirm touching time boundaries such as `08:00–12:00` and
    `12:00–16:00` do not produce a conflict.
-   Confirm an existing inactive/out-of-stock Course can still be
    considered during conflict checking.
-   Confirm a known scheduling conflict prevents enrollment.
-   Confirm the schedule is rechecked immediately before enrollment
    submission and that a conflict prevents the POST request.
-   Confirm a conflict-check request failure is reported separately from
    ordinary form validation.

These are regression checks for the completed feature; they are not
described here as automated tests.

## Repository

This project is maintained as part of the Got Skills application
development work.

The codebase contains separate Node.js backend and React frontend
repositories managed through a parent Git repository.

## Author

**Benjamin Klass**

Full-stack development work involving React, Node.js, Express, MongoDB,
REST APIs, authentication, CRM-style data management, and
payment/customer integration.

## Payment Invoice and Receipt Downloads

The Payments page now provides direct access to the PDF invoice and
receipt associated with each payment record.

Two action columns have been added to the reusable `PaymentsTable`:

-   **Download Invoice**
-   **Download Receipt**

The previous generic **View** action was removed because the
document-specific actions provide clearer navigation.

### Document Download Architecture

The two document types intentionally use different identifiers:

-   An **invoice** belongs to an enrollment, so the Payments table
    passes `payment.enrollmentId`.
-   A **receipt** represents a specific payment transaction, so the
    Payments table passes `payment._id`.

``` text
Payments page
     |
     v
PaymentsTable
     |
     +---------------------------+
     |                           |
     v                           v
Download Invoice          Download Receipt
     |                           |
payment.enrollmentId          payment._id
     |                           |
     v                           v
/enrollmentPrint           /receiptPrint
     |                           |
     v                           v
enrollmentPrint.jsx        receiptPrint.jsx
     |                           |
     v                           v
getEnrollment(id)          getPayment(paymentId)
     |                           |
     v                           v
Enrollment                 Payment
     |                           |
     +---- getCustomer()         |
     +---- getProduct()          |
     |                           |
     v                           v
invoiceData                 receiptData
     |                           |
     v                           v
Invoice PDF                 Receipt PDF
     |                           |
     +---- PDFViewer             +---- PDFViewer
     +---- PDFDownloadLink       +---- PDFDownloadLink
```

### Payments Table Links

The Invoice action passes only the enrollment ID:

``` javascript
{
  key: "downloadInvoice",
  label: "Download Invoice",
  sortable: false,
  content: (payment) => (
    <Link
      className="font-weight-bold btn btn-sm btn-success"
      to={{
        pathname: "/enrollmentPrint",
        state: {
          enrollmentId: payment.enrollmentId,
        },
      }}
    >
      Download Invoice
    </Link>
  ),
}
```

The Receipt action passes the ID of the exact payment row:

``` javascript
{
  key: "downloadReceipt",
  label: "Download Receipt",
  sortable: false,
  content: (payment) => (
    <Link
      className="font-weight-bold btn btn-sm btn-success"
      to={{
        pathname: "/receiptPrint",
        state: {
          paymentId: payment._id,
        },
      }}
    >
      Download Receipt
    </Link>
  ),
}
```

Using `payment._id` for receipts is important because it identifies one
exact payment transaction rather than merely identifying the enrollment
or student.

### Invoice Page Refactor

`enrollmentPrint.jsx` was refactored so that it no longer depends on the
Completion Form passing a complete view-model object through React
Router state.

The page now receives an `enrollmentId` and retrieves the data it
requires itself:

``` text
enrollmentId
     |
     v
getEnrollment(enrollmentId)
     |
     v
Enrollment
     |
     +-------------------+
     |                   |
     v                   v
customer._id          product._id
     |                   |
     v                   v
getCustomer()         getProduct()
     |                   |
     +---------+---------+
               |
               v
          invoiceData
               |
               v
           Invoice PDF
```

The main retrieval logic is conceptually:

``` javascript
const locationState = this.props.location.state || {};
const enrollmentId = locationState.enrollmentId;

const { data: enrollment } = await getEnrollment(enrollmentId);

const [{ data: student }, { data: product }] = await Promise.all([
  getCustomer(enrollment.customer._id),
  getProduct(enrollment.product._id),
]);

this.setState({
  enrollment,
  student,
  product,
});
```

Once the records are available, the component constructs `invoiceData`
and passes it to the existing React PDF components:

``` jsx
<PDFViewer width={800} height={1100}>
  <Invoice invoice={invoiceData} />
</PDFViewer>

<PDFDownloadLink
  document={<Invoice invoice={invoiceData} />}
  fileName="document.pdf"
>
  {({ loading }) =>
    loading ? "Loading document..." : "Download"
  }
</PDFDownloadLink>
```

This makes the Invoice page more self-contained and allows it to be
opened from both the Payments table and the existing enrollment
workflow.

### Receipt Page Refactor

`receiptPrint.jsx` now supports two navigation paths.

When opened from the Payments table, it receives a `paymentId` and
retrieves the exact payment:

``` javascript
response = await getPayment(locationState.paymentId);
```

When opened from the existing Completion Form, it can still receive an
`enrollmentId`:

``` javascript
response = await getPaymentByEnrollmentId(
  locationState.enrollmentId
);
```

The combined logic is:

``` javascript
if (locationState.paymentId) {
  response = await getPayment(locationState.paymentId);
} else if (locationState.enrollmentId) {
  response = await getPaymentByEnrollmentId(
    locationState.enrollmentId
  );
} else {
  toast.error("Missing payment information.");
  return;
}
```

The retrieved Payment is transformed into `receiptData` and passed to
the existing `Receipt` PDF component.

### Completion Form Compatibility

The existing Completion Form Invoice and Receipt buttons were updated to
pass identifiers instead of copying the entire form state.

Invoice:

``` javascript
state: {
  enrollmentId: this.state.data._id,
}
```

Receipt:

``` javascript
state: {
  enrollmentId: this.state.data._id,
}
```

The existing business rule remains in place: the Completion Form only
displays its Receipt button when `enrollmentPaid === true`.

### Payment Table Sorting

The new document columns are actions rather than data fields and
therefore should not be sortable.

They use:

``` javascript
sortable: false
```

The shared `TableHeader` component was updated to respect this property:

``` jsx
<th
  className={column.sortable === false ? "" : "clickable"}
  key={column.path || column.key}
  onClick={() =>
    column.sortable !== false && this.raiseSort(column.path)
  }
>
  {column.label} {this.renderSortIcon(column)}
</th>
```

The Course column sorting path was also corrected from `enrollment` to
the actual displayed payment field:

``` javascript
path: "productCode"
```

As a result, normal payment data columns remain sortable while
**Download Invoice** and **Download Receipt** are non-sortable action
columns.

## Testing the Invoice and Receipt Download Feature

The feature was tested using both the React interface and MongoDB
records.

### Verify a Specific Payment

A known payment can be inspected directly in `mongosh`:

``` javascript
db.payments.findOne({
  _id: ObjectId("64e30a399107cf006c530bbf")
})
```

The returned record can then be compared with the Receipt opened from
the corresponding Payments-table row.

Relevant fields include:

-   `_id`
-   `enrollmentId`
-   `customerId`
-   `name`
-   `productCode`
-   `productInvoice`
-   `productDescription`
-   `grossAmount`
-   `transactionDate`
-   `spTransactionId`
-   `serviceProvider`
-   `isFullPayment`

### Verify the Corresponding Enrollment

Using the payment's `enrollmentId`, the related enrollment can be
inspected:

``` javascript
db.enrollments.findOne({
  _id: ObjectId("ENROLLMENT_ID")
})
```

The enrollment's customer, product, dates, fee, and payment status can
then be compared with the Invoice opened from that payment row.

### Multiple Payments for the Same Student

Customers with multiple payments can be found with:

``` javascript
db.payments.aggregate([
  {
    $group: {
      _id: "$customerId",
      paymentCount: { $sum: 1 }
    }
  },
  {
    $match: {
      paymentCount: { $gt: 1 }
    }
  },
  {
    $sort: {
      paymentCount: -1
    }
  }
])
```

Each payment row should open the receipt for that exact transaction.

### Multiple Payments for One Enrollment

A further edge-case test checks whether any enrollment has more than one
Payment record:

``` javascript
db.payments.aggregate([
  {
    $group: {
      _id: "$enrollmentId",
      paymentCount: { $sum: 1 },
      paymentIds: { $push: "$_id" }
    }
  },
  {
    $match: {
      paymentCount: { $gt: 1 }
    }
  }
])
```

If multiple payments exist for one enrollment, the Payments-table
Receipt links should still produce distinct receipts because each row
passes its own `payment._id` to `getPayment(paymentId)`.

### Regression and Error Tests

The document feature should also be checked for the following scenarios:

  ---------------------------------------------------------------------
  Scenario                           Expected Behaviour
  ---------------------------------- ----------------------------------
  Different payment rows             Each row opens its own documents

  Download Invoice                   Correct enrollment invoice
                                     displayed

  Download Receipt                   Correct individual payment receipt
                                     displayed

  Completion Form Invoice            Existing invoice workflow still
                                     works

  Completion Form Receipt            Existing paid-enrollment receipt
                                     workflow still works

  PDF Download                       Downloaded PDF matches the
                                     PDFViewer document

  Missing `enrollmentId`             Invoice page reports missing
                                     information rather than crashing

  Missing payment information        Receipt page reports missing
                                     information rather than crashing

  Invalid/nonexistent ID             API error is handled cleanly

  Course column                      Sorts using `productCode`

  Download Invoice header            Non-sortable

  Download Receipt header            Non-sortable
  ---------------------------------------------------------------------

## Updated Payment Document Request Lifecycle

The newly-added feature exercises a broader
full-stack/document-generation lifecycle:

``` text
Payment row
    |
    +-----------------------+
    |                       |
    v                       v
enrollmentId             paymentId
    |                       |
    v                       v
React Router state       React Router state
    |                       |
    v                       v
enrollmentPrint.jsx      receiptPrint.jsx
    |                       |
    v                       v
Frontend service         Frontend service
    |                       |
    v                       v
Express API              Express API
    |                       |
    v                       v
Mongoose                 Mongoose
    |                       |
    v                       v
MongoDB Enrollment       MongoDB Payment
    |                       |
    v                       v
PDF data object          PDF data object
    |                       |
    v                       v
PDFViewer                PDFViewer
    |                       |
    v                       v
PDFDownloadLink          PDFDownloadLink
```

This implementation demonstrates reuse of existing application
components, identifier-based navigation, API retrieval, MongoDB
relationships, React state management, and client-side PDF generation.

### Direct receipt links from Calendar events

In addition to the React Router state navigation described above, the
Calendar can open a receipt in a new tab using
`/receiptPrint?paymentId=PAYMENT_OBJECT_ID`. The receipt page reads the
payment ID from the query string when no payment ID is supplied in
router state. This allows direct navigation to a specific receipt
without first opening the Payments list.

## Assorted Calendar Event Features

The Calendar and Enrollment workflows have been extended with additional
scheduling, display, and Course-participant features. These additions
build on the existing Calendar Time Extension and reuse the existing
Product, Enrollment, and Payment data rather than introducing parallel
calendar state or unnecessary API requests.

### Enrollment Conflict Enforcement

The Course-conflict system now actively prevents conflicting
enrollments.

The existing conflict state is reused:

``` javascript
scheduleConflicts
conflictChecking
conflictCheckError
```

A selected Student/Course combination cannot be enrolled while a known
schedule conflict exists. Enrollment is also blocked while conflict
checking is in progress or when the conflict check fails.

The submission path is protected independently of the UI. Immediately
before saving, `doEnrollment()` performs a final conflict check and
returns without calling `saveEnrollment()` when the schedule is not
known to be safe.

The conflict rule itself remains unchanged:

``` javascript
const datesOverlap =
  newStartDate <= existingEndDate &&
  newEndDate >= existingStartDate;

const timesOverlap =
  newCourse.startTime < existingCourse.endTime &&
  newCourse.endTime > existingCourse.startTime;
```

Date ranges therefore overlap inclusively, while time ranges use strict
boundaries. Adjacent Courses such as `08:00–12:00` and `12:00–16:00`
remain permitted.

### Compact Payment and Enrollment Calendar Titles

Payment and Enrollment calendar cards now use presentation-specific
titles designed for limited calendar space.

The card-title rules are:

-   Student name first
-   No date in the custom title
-   Maximum 20 characters
-   Ellipsis included within the 20-character limit

Conceptually:

``` javascript
truncateCalendarTitle(
  `${studentName} - Payment`,
  20
);

truncateCalendarTitle(
  `${studentName} - Enrollment`,
  20
);
```

The compact title is stored separately from the complete event
information. The original Payment or Enrollment record remains attached
to the calendar event, and the full event title remains available for
hover and detailed pop-up information.

In React Big Calendar's Day and Week time-grid views, the library's
separate automatic time label is hidden specifically for Payment and
Enrollment events. This ensures that **both Day and Week views use the
same Student-first compact format**, rather than displaying a time
prefix before the 20-character title.

Course event timing and the actual Payment/Enrollment timestamps are not
changed by this presentation rule.

### Dynamic Day and Week Calendar Hours

Day and Week views now calculate their visible hourly range from the
events in the currently displayed period.

For **Day** view, the calendar examines events belonging to the selected
day.

For **Week** view, the calendar examines all events in the selected week
and uses one consistent time scale across every day in that week.

When events exist:

``` text
minimum visible time = earliest event start
maximum visible time = latest event end
```

The interval between those boundaries remains continuous. Empty gaps
between events are not independently removed.

For example, if the earliest event begins at 01:00 and the latest
relevant event ends at 08:00, the calendar displays the continuous
range:

``` text
01:00–08:00
```

If the selected Day has no events, or the entire selected Week has no
events, the fallback workday range is:

``` text
08:00–17:00
```

An empty day inside a non-empty Week still uses the Week's shared
earliest and latest times.

Month and Agenda retain their normal React Big Calendar layouts because
Month does not use the same vertical hourly time grid.

### Course Enrollment Grouping

Course calendar events now derive their enrolled Students from the
Enrollment data already loaded by:

``` text
GET /api/enrollments/all
```

Each Enrollment already contains embedded Customer and Product
information, so the frontend groups Enrollment records by:

``` javascript
enrollment.product._id
```

and derives Students from:

``` javascript
enrollment.customer
```

No additional Course-Students endpoint is required, and the Calendar
does not perform an N+1 request loop.

Students are defensively deduplicated by Customer/Student `_id`. If the
same Student appears in more than one Enrollment record for a Course,
the Student is displayed only once in that Course's calendar Student
collection.

### Students on Course Calendar Cards

Course event cards display enrolled Student names beneath the Course
title.

The number shown is intentionally view-dependent so that smaller
calendar cells do not become unreadable. The current limits are
configurable in `calendar.jsx`, conceptually:

``` javascript
const COURSE_STUDENT_LIMITS = {
  month: 2,
  week: 3,
  day: 5,
  agenda: 5,
};
```

When the complete Student list does not fit within the configured limit,
the remaining count is displayed using:

``` text
+ X more students
```

For example:

``` text
JavaScript Fundamentals

Benjamin Klass
Sarah Cohen
David Levy
+ 7 more students
```

Every daily calendar occurrence generated for the same Course receives
the same deduplicated Student collection.

### Expanded Course Student Lists in Pop-ups

Selecting a Course event opens the existing Course details pop-up with a
larger version of the same enrolled-Student collection used by the
calendar card.

The popup Student limit is intentionally higher than the card limit.
When the Course has more Students than the popup limit, the remainder is
again shown as:

``` text
+ X more students
```

The Course/Enrollment relationship is therefore implemented once and
reused by both presentation surfaces.

A Course with no associated Students displays an explicit empty state
rather than an empty list.

### Course Pop-up Footer Layout

The Course pop-up was adjusted so that its actions remain at the bottom
even when a long Student list makes the content taller than the
available window.

The popup card uses a vertical flex layout:

``` javascript
display: "flex"
flexDirection: "column"
overflow: "hidden"
```

The body is the scrollable region:

``` javascript
flex: "1 1 auto"
minHeight: 0
overflowY: "auto"
```

while the footer uses:

``` javascript
flexShrink: 0
```

The final Course popup order is:

``` text
Course information
Enrolled Students
-------------------------------
Close | View CRM Record
```

When the popup content exceeds the available height, the Course
information and Student list scroll inside the body while **Close** and
**View CRM Record** remain in the footer at the bottom.

### Calendar Data and Presentation Separation

The latest Calendar changes preserve a deliberate distinction between
source data and compact presentation data.

``` text
Payment / Enrollment source record
        |
        +-- complete event title
        +-- original source object
        +-- exact timestamp
        |
        +-- compact cardTitle (presentation only)

Course source record
        |
        +-- daily timed occurrences
        +-- deduplicated Student collection
        |
        +-- limited card Student list
        +-- expanded popup Student list
```

This allows compact cards and responsive pop-ups without truncating or
discarding the underlying CRM information.

### Assorted Calendar Feature Verification

Recommended regression checks include:

-   Confirm a known Course conflict disables **Enroll**.
-   Confirm a non-conflicting Course permits enrollment when ordinary
    form validation succeeds.
-   Confirm a conflict-check failure blocks enrollment rather than being
    treated as no conflict.
-   Confirm direct submission cannot bypass the final conflict guard.
-   Confirm touching schedules such as `08:00–12:00` and `12:00–16:00`
    remain non-conflicting.
-   Confirm Payment and Enrollment cards are Student-first and no longer
    than 20 characters.
-   Confirm the compact Payment/Enrollment format is used in both Day
    and Week views without a separate time prefix.
-   Confirm complete Payment and Enrollment information remains
    available in hover and pop-up details.
-   Confirm an empty Day displays `08:00–17:00`.
-   Confirm an entirely empty Week displays `08:00–17:00`.
-   Confirm a non-empty Day contracts to its earliest start and latest
    end.
-   Confirm a non-empty Week uses one shared earliest/latest time scale.
-   Confirm empty gaps between events remain visible inside that
    continuous range.
-   Confirm Course cards display enrolled Students.
-   Confirm duplicate Enrollment records do not duplicate Students.
-   Confirm `+ X more students` is calculated correctly.
-   Confirm the Course popup displays a larger Student list than the
    card.
-   Confirm the popup remainder count is correct.
-   Confirm a Course with no Students displays the empty state.
-   Confirm **Close** and **View CRM Record** remain at the bottom of a
    tall Course popup.
-   Confirm scrolling a tall Course popup scrolls the body rather than
    the footer.
-   Recheck Month, Week, Day, and Agenda navigation, summary totals,
    event colors, CRM record links, and Payment receipt links.

These are recommended manual regression checks unless corresponding
automated tests are added separately.

