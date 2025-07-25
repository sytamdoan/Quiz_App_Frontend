import apiClient from "./services";

export default {
  getItems(quizID) {
    return apiClient.get("/Quiz/" + quizID + "/QuizSession/");
  },
  addItem(quizID, QuizSession) {
    return apiClient.post("/Quiz/" + quizID + "/QuizSession/", QuizSession);
  },
  updateItem(QuizSessionID, QuizSession) {
    return apiClient.put("/QuizSession/" + QuizSessionID, QuizSession);
  },
  deleteItem(QuizSessionID) {
    return apiClient.delete("/QuizSession/" + QuizSessionID)
  },
  getQuizSession(sessionId) {
    return apiClient.get("/QuizSession/" + sessionId);
  },
  addQuizSession(QuizSession) {
    return apiClient.post("/QuizSession/", QuizSession);
  },
  endQuizSession(QuizSession) {
    return apiClient.put("/QuizSession/" + QuizSession);
  },
  findQuizSession(QuizSession) {
    return apiClient.get("/QuizSession/EntryCode/" + QuizSession);
  },
};
