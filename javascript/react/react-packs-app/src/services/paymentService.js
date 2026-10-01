import http from "./httpService";

const apiEndpoint = "/payments"; // All payments
const apiByEnrollmentId = "/enrollment"; // Payment by Enrollment

function paymentUrl(id) {
  return `${apiEndpoint}/${id}`;
}

function paymentByEnrollmentUrl(id) {
  return `${apiEndpoint + apiByEnrollmentId}/${id}`;
}

// Builds the API URL for retrieving all payments belonging to a specific customer.
function paymentByCustomerUrl(customerId) {
  return `${apiEndpoint}/customer/${customerId}`;
}

// DA 01/03/2023 Excluded enrollments which have been completed
export async function getPayments() {
  return await http.get(apiEndpoint);
}

export async function getPayment(paymentId) {
  return await http.get(paymentUrl(paymentId));
}

export async function getPaymentByEnrollmentId(enrollmentId) {
  return await http.get(paymentByEnrollmentUrl(enrollmentId));
}

// Retrieves all payments associated with a specific customer from the backend.
export async function getPaymentsByCustomerId(customerId) {
  return await http.get(paymentByCustomerUrl(customerId));
}

export async function savePayment(payment) {
  return await http.post(apiEndpoint, payment);
}
