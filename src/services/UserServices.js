import apiClient from "./services";

export default {
  getUserNames(id) {
    return apiClient.get("usernames/" + id)
  },
  getUser() {
    return apiClient.get("users");
  },
  addUser(user) {
    return apiClient.post("users", user);
  },
  loginUser(user) {
    console.log(user);
    return apiClient.post("login", user.value, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        crossDomain: true,
        Authorization:
          "Basic " + btoa(user.value.email + ":" + user.value.password),
      },
    });
  },
  logoutUser() {
    return apiClient.post("logout");
  },
  deleteUser(userID) {
    return apiClient.delete("/users/" + userID)
  },
  updateUser(userID, User) {
    return apiClient.put("/users/" + userID, User)
  },
};
