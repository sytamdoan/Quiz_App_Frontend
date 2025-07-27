import apiClient from "./services";

export default {
  getOneQuestion(questionId) {
    return apiClient.get("/Question/" + questionId);
  },
  getQuestion(quizId) {
    return apiClient.get("/Quiz/" + quizId + "/Questions/");
  },
  addQuestion(quizId, Question) {
    return apiClient.post("/Quiz/" + quizId + "/Question/", Question);
  },
  updateQuestion(QuestionID, Question) {
    return apiClient.put("/Question/" + QuestionID, Question);
  },
  deleteQuestion(QuestionID) {
    return apiClient.delete("/Question/" + QuestionID)
  }
};
