import http from "./httpService";

const apiEndpoint = "/products";

function productUrl(id) {
  return `${apiEndpoint}/${id}`;
}

export async function getProducts() {
  return await http.get(apiEndpoint);
}

export async function getProduct(productId) {
  return await http.get(productUrl(productId));
}

export async function saveProduct(product) {
  if (product._id) {
    const body = { ...product };
    delete body._id;

    return await http.put(productUrl(product._id), body);
  }

  return await http.post(apiEndpoint, product);
}

export async function deleteProduct(productId) {
  await http.delete(productUrl(productId));
}
