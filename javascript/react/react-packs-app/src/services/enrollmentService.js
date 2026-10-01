// ============================================================
// Enrollment Service
// ============================================================
//
// This service contains the frontend functions used to communicate
// with the enrollment-related Node/Express API endpoints.
//
// Components should use these functions instead of making HTTP
// requests directly.
//
// Main API prefix:
//
// /enrollments
//
// The backend routes are defined in:
//
// nodejs-packs-endpoint/routes/enrollments.js
//
// ============================================================

import http from "./httpService";


// ============================================================
// API ENDPOINTS
// ============================================================

// Base enrollment API endpoint.
//
// GET /enrollments
//
// Returns open/current enrollments that do not have a
// completion date. These enrollments may be paid or unpaid.
//
// This base endpoint is also used when creating a new enrollment.
const apiEndpoint = "/enrollments";


// GET /enrollments/_completedPaid
//
// Returns enrollments that have been completed and paid.
const apiCompletedPaid = "/_completedPaid";


// GET /enrollments/_completedNotPaid
//
// Returns enrollments that have been completed but have not
// been paid.
const apiCompletedNotPaid = "/_completedNotPaid";


// GET /enrollments/_enrollmentsPaid
//
// Returns all paid enrollments, including both completed
// and not-completed enrollments.
const apiEnrollmentPaid = "/_enrollmentsPaid";


// GET /enrollments/all
//
// Returns all enrollments regardless of:
//
// - completion status
// - payment status
const apiAllEnrollmentsPaidNotPaid = "/all";


// GET /enrollments/_enrolledNotCompletedNotPaid
//
// Returns enrollments that:
//
// - have not been completed
// - have not been paid
const apiEnrolledNotCompletedNotPaid =
  "/_enrolledNotCompletedNotPaid";


// ============================================================
// BUILD URL FOR ONE ENROLLMENT
// ============================================================

// Creates the API URL used to retrieve one specific enrollment.
//
// Example:
//
// enrollmentUrl("64e30a399107cf006c530bbf")
//
// produces:
//
// /enrollments/64e30a399107cf006c530bbf
//
// This corresponds to the backend route:
//
// GET /api/enrollments/:id
function enrollmentUrl(id) {
  return `${apiEndpoint}/${id}`;
}


// ============================================================
// GET CURRENT / OPEN ENROLLMENTS
// ============================================================

// DA 01/03/2023
//
// Retrieves enrollments that have not been completed.
//
// Backend route:
//
// GET /api/enrollments
//
// The backend excludes enrollments that contain a
// completionDate.
export async function getEnrollments() {
  return await http.get(apiEndpoint);
}


// ============================================================
// GET ONE ENROLLMENT BY ENROLLMENT ID
// ============================================================

// Retrieves one specific enrollment using the Enrollment
// document's MongoDB _id.
//
// Example:
//
// getEnrollment("64e30a399107cf006c530bbf")
//
// sends:
//
// GET /api/enrollments/64e30a399107cf006c530bbf
//
// This function is used when the application needs the details
// of one specific enrollment, such as the Completion Form or
// invoice-generation workflow.
export async function getEnrollment(enrollmentId) {
  return await http.get(enrollmentUrl(enrollmentId));
}


// ============================================================
// GET ALL ENROLLMENTS FOR ONE CUSTOMER
// ============================================================

// Customer Record Enrollments List feature.
//
// Retrieves every enrollment associated with one
// customer/student.
//
// The customerId will normally come from the Customer Form URL:
//
// this.props.match.params.id
//
// Example:
//
// getEnrollmentsByCustomerId(
//   "64e30a399107cf006c530bbf"
// )
//
// sends:
//
// GET /api/enrollments/customer/64e30a399107cf006c530bbf
//
// The corresponding backend route is:
//
// GET /api/enrollments/customer/:customerId
//
// The backend searches the Enrollment collection using:
//
// "customer._id": customerId
//
// because customer information is embedded inside each
// Enrollment document.
//
// The backend returns an array containing all matching
// enrollments:
//
// [
//   enrollment1,
//   enrollment2,
//   ...
// ]
//
// If the customer has no enrollments, the backend returns:
//
// []
//
// CustomerForm.jsx will eventually store this returned data in:
//
// this.state.enrollments
//
// This follows the same general design as the existing
// customer-associated Payments feature.
export async function getEnrollmentsByCustomerId(customerId) {
  return await http.get(
    `${apiEndpoint}/customer/${customerId}`
  );
}


// ============================================================
// CREATE A NEW ENROLLMENT
// ============================================================

// Creates a new enrollment between a customer and a product/course.
//
// Sends:
//
// POST /api/enrollments
//
// Request body:
//
// {
//   customerId: "...",
//   productId: "..."
// }
//
// The backend validates the customer and product, creates the
// Enrollment document, and decreases the product's available
// stock.
export async function saveEnrollment(
  customerId,
  productId
) {
  return await http.post(apiEndpoint, {
    customerId: customerId,
    productId: productId,
  });
}


// ============================================================
// GET ALL PAID ENROLLMENTS
// ============================================================

// DA 01/04/2023
//
// Returns all enrollments whose enrollmentPaid field is true.
//
// This includes both completed and not-completed enrollments.
//
// Sends:
//
// GET /api/enrollments/_enrollmentsPaid
export async function getPaidEnrollments() {
  return await http.get(
    apiEndpoint + apiEnrollmentPaid
  );
}


// ============================================================
// GET COMPLETED AND PAID ENROLLMENTS
// ============================================================

// DA 01/04/2023
//
// Returns enrollments that:
//
// - have been completed
// - have been paid
//
// Sends:
//
// GET /api/enrollments/_completedPaid
export async function getCompletedPaidEnrollments() {
  return await http.get(
    apiEndpoint + apiCompletedPaid
  );
}


// ============================================================
// GET COMPLETED BUT UNPAID ENROLLMENTS
// ============================================================

// DA 01/04/2023
//
// Returns enrollments that:
//
// - have been completed
// - have NOT been paid
//
// Sends:
//
// GET /api/enrollments/_completedNotPaid
export async function getCompletedNotPaidEnrollments() {
  return await http.get(
    apiEndpoint + apiCompletedNotPaid
  );
}


// ============================================================
// GET ALL ENROLLMENTS
// ============================================================

// DA 01/04/2023
//
// Returns all enrollments regardless of:
//
// - whether they have been paid
// - whether they have been completed
//
// Sends:
//
// GET /api/enrollments/all
export async function getAllPaidNotPaidEnrollments() {
  return await http.get(
    apiEndpoint + apiAllEnrollmentsPaidNotPaid
  );
}


// ============================================================
// GET ACTIVE / NOT-COMPLETED / UNPAID ENROLLMENTS
// ============================================================

// DA 01/04/2023
//
// Returns enrollments that:
//
// - have not been completed
// - have not been paid
//
// Sends:
//
// GET /api/enrollments/_enrolledNotCompletedNotPaid
export async function getEnrolledNotCompletedNotPaid() {
  return await http.get(
    apiEndpoint + apiEnrolledNotCompletedNotPaid
  );
}