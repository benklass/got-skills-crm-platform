import http from "./httpService";

const apiEndpoint = "/users";

function userUrl(id) {
  return `${apiEndpoint}/${id}`;
}

// function userTypeUrl() {
//   return `${apiEndpoint}/_userTypes`;
// }

// DA 07-04-2023 Used in the Registration of the User
export async function register(user) {
  return await http.post(apiEndpoint, {
    email: user.username,
    password: user.password,
    name: user.name,
    isAdmin: user.isAdmin,
    isInstructor: user.isInstructor,
    isStudent: user.isStudent,
    isParent: user.isParent,
    linkInstructorId: user.linkInstructorId,
    linkStudentId: user.linkStudentId,
  });
}

// DA 07-04-2023 Added getUsers and User for user edit
export async function getUsers() {
  return await http.get(apiEndpoint);
}

export async function getUser(userId) {
  return await http.get(userUrl(userId));
}

// DA 07 04 2023 Added to edit User for userType and to Add users set isAdmin Always to false
// Use the edit to change the user type
export async function saveUser(user) {
  if (user._id) {
    const body = { ...user };
    delete body._id;

    return await http.put(userUrl(user._id), body);
  }
  return await http.post(apiEndpoint, user);
}

// TODO Add deleteUser in Node.js APP
export async function deleteUser(userId) {
  return await http.delete(userUrl(userId));
}
