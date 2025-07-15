import apiClient from "./services";

export default {
  getAnswer(questionID) {
    return apiClient.get("/Quiz/" + questionID + "/Answer/");
  },
  addAnswer(questionID, Answer) {
    return apiClient.post("/Quiz/" + questionID + "/Answer/", Answer);
  },
  updateAnswer(answerId, Answer) {
    return apiClient.put("/Answer/" + answerId, Answer);
  },
  deleteAnswer(answerId) {
    return apiClient.delete("/Answer/" + answerId)
  }
};
