import http from "./httpService";

const apiEndpoint = "/customers";

function customerUrl(id) {
  return `${apiEndpoint}/${id}`;
}

export async function getCustomers() {
  return await http.get(apiEndpoint);
}

export async function getCustomer(customerId) {
  return await http.get(customerUrl(customerId));
}

export async function saveCustomer(customer) {
  if (customer._id) {
    const body = { ...customer };
    delete body._id;

    return await http.put(customerUrl(customer._id), body);
  }
  return await http.post(apiEndpoint, customer);
}

export async function deleteCustomer(customerId) {
  return await http.delete(customerUrl(customerId));
}
