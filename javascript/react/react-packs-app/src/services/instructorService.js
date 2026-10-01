import http from "./httpService";

const apiEndpoint = "/instructors";

function instructorUrl(id) {
  return `${apiEndpoint}/${id}`;
}

export async function getInstructors() {
  return await http.get(apiEndpoint);
}

export async function getInstructor(instructorId) {
  return await http.get(instructorUrl(instructorId));
}

export async function saveInstructor(instructor) {
  if (instructor._id) {
    const body = { ...instructor };
    delete body._id;

    return await http.put(instructorUrl(instructor._id), body);
  }
  return await http.post(apiEndpoint, instructor);
}

export async function deleteInstructor(instructorId) {
  return await http.delete(instructorUrl(instructorId));
}
