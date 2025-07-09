import apiClient from "./services";

export default {
  getClass(classID) {
    return apiClient.get("Class", classID);
  },
  addClass(Class) {
    return apiClient.post("/Class/", Class);
  },
  updateClass(classID, Class) {
    return apiClient.put("/Class/" + classID, Class);
  },
  deleteClass(classID) {
    return apiClient.delete("/Class/" + classID)
  }
};
