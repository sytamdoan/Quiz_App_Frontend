import apiClient from "./services";

export default {
  getItems(Filter) {
    return apiClient.get("/Response", { params: Filter });
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
