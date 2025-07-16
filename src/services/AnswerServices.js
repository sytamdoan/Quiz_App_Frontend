import apiClient from "./services";

export default {
  getAnswer(questionId) {
    return apiClient.get("/Question/" + questionId + "/Answers/");
  },
  addAnswer(questionId, Answer) {
    return apiClient.post("/Question/" + questionId + "/Answer/", Answer);
  },
  updateAnswer(answerId, Answer) {
    return apiClient.put("/Answer/" + answerId, Answer);
  },
  deleteAnswer(answerId) {
    return apiClient.delete("/Answer/" + answerId)
  }
};
