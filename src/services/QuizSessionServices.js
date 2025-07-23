import apiClient from "./services";

export default {
  getQuizSession(quizID) {
    return apiClient.get("/Quiz/" + quizID + "/QuizSession/");
  },
  addQuizSession(quizID, QuizSession) {
    return apiClient.post("/Quiz/" + quizID + "/QuizSession/", QuizSession);
  },
  updateQuizSession(QuizSessionID, QuizSession) {
    return apiClient.put("/QuizSession/" + QuizSessionID, QuizSession);
  },
  deleteQuizSession(QuizSessionID) {
    return apiClient.delete("/QuizSession/" + QuizSessionID)
  }
};
