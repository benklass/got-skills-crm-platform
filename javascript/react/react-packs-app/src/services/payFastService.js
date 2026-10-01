import http from "./httpService";

const apiEndpoint = "/completions";
const sandboxApiEndpoint = "";

export async function completepayFastPayment(
  enrollmentId,
  customerId,
  productId
) {
  return await http.post(apiEndpoint, {
    enrollmentId: enrollmentId,
    customerId: customerId,
    productId: productId,
  });
}
