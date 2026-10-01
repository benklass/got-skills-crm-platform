import http from "./httpService";

const apiEndpoint = "/rentals";

function rentalUrl(id) {
  return `${apiEndpoint}/${id}`;
}

// DA 01/03/2023 Excluded rentals which have been returned for the query to the API endpoint
export async function getRentals() {
  return await http.get(apiEndpoint);
}

export async function getRental(rentalId) {
  return await http.get(rentalUrl(rentalId));
}

export async function saveRental(customerId, movieId) {
  return await http.post(apiEndpoint, {
    customerId: customerId,
    movieId: movieId,
  });
}
