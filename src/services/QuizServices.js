import apiClient from "./services";

export default {
  getQuiz(classID) {
    return apiClient.get("/Class/" + classID + "/Quiz/");
  },
  addQuiz(classID, Quiz) {
    return apiClient.post("/Class/" + classID + "/Quiz/", Quiz);
  },
  updateQuiz(QuizID, Quiz) {
    return apiClient.put("/Quiz/" + QuizID, Quiz);
  },
  deleteQuiz(QuizID) {
    return apiClient.delete("/Quiz/" + QuizID)
  },
  duplicateQuiz(quizId) {
  return apiClient.post("/Quiz/" + quizId + "/duplicate");
  }
};
