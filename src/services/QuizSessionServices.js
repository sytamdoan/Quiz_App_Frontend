import apiClient from "./services";

export default {
  getQuizSession(sessionId) {
    return apiClient.get("/QuizSession/" + sessionId);
  },
  addQuizSession(QuizSession) {
    return apiClient.post("/QuizSession/", QuizSession);
  },
};
