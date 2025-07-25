import apiClient from "./services";

export default {
  getQuiz(sessionId) {
    return apiClient.get("/QuizSession/" + sessionId);
  },
  addQuiz(QuizSession) {
    return apiClient.post("/QuizSession/", QuizSession);
  },
};
