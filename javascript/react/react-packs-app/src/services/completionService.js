import http from "./httpService";

const apiEndpoint = "/completions";

export async function completeEnrollment(enrollmentId, customerId, productId) {
  return await http.post(apiEndpoint, {
    enrollmentId: enrollmentId,
    customerId: customerId,
    productId: productId,
  });
}
