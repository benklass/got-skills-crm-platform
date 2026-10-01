import http from "./httpService";

const apiEndpoint = "/returns";

export async function returnCheckOut(rentalId, customerId, movieId) {
  return await http.post(apiEndpoint, {
    rentalId: rentalId,
    customerId: customerId,
    movieId: movieId,
  });
}
