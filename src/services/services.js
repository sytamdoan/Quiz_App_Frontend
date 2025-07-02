import axios from "axios";

var baseurl = "";
if (process.env.NODE_ENV === "development") {
  baseurl = "http://localhost/quizappapi/";
} else {
  baseurl = "/quizappapi/";
}

const apiClient = axios.create({
  baseURL: baseurl,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Access-Control-Allow-Origin": "*",
    crossDomain: true,
  },
  transformRequest: (data, headers) => {
    let token = null;
    if (localStorage.getItem("user") !== null) {
      token = JSON.parse(localStorage.getItem("user")).token;
    }
    let authHeader = "";
    if (token !== null && token !== "") {
      authHeader = "Bearer " + token;
      headers["Authorization"] = authHeader;
    }
    return JSON.stringify(data);
  },
  transformResponse: function (data) {
    data = JSON.parse(data);
    if (!data.success && data.code == "expired-session") {
      localStorage.removeItem("user");
    }
    return data;
  },
});

// Add a request interceptor to inject the token if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // or from Vuex
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
