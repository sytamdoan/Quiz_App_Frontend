import apiClient from "./services";

export default {
  getOneAnswer(answerId) {
    return apiClient.get("/Answer/" + answerId);
  },
  getAnswer(questionId) {
    return apiClient.get("/Question/" + questionId + "/Answers/");
  },
  getAnswersWithFilter(Filter){
    return apiClient.get("/Answer/filter", {params: Filter} )
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
