import apiClient from "./services";

export default {
  getItems() { // note: add filters (i.e., QuizSession) to req.body
    return apiClient.get("/Response");
  },
  getItem(id) {
    return apiClient.get("/Response/" + id)
  },
  addItem(Item) {
    return apiClient.post("/Response", Item);
  },
  deleteItem(id) {
    return apiClient.delete("/Response/" + id)
  }
};
