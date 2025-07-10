import apiClient from "./services";

export default {
  getClass() {
    return apiClient.get("Class");
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
