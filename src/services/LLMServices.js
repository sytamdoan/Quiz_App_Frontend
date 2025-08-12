import apiClient from "./services";

export default {
  getRecommendations(quiz) {
    return apiClient.post("recommend", quiz);
  },
  getGeneratedQuizForClass(id) {
    return apiClient.post("generateQuiz/" + id);
  }
};