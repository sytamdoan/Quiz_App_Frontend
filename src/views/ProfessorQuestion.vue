<script setup>
import { onMounted } from 'vue'
import { io } from 'socket.io-client';
import { ref, computed  } from "vue";
import QuestionServices from "../services/QuestionServices.js";
import AnswerServices from "../services/AnswerServices.js";

const socket = io('http://localhost:3001');
const quizID = ref(1);
const questionSet = ref({})
const answerSet = ref({})
const currentQuestion = ref(0)

onMounted(async () => {
  try {
    socket.on("connect", () => {
      console.log("Connnected To Backend From Professor");
    })
    await grabQuestions();
    sendQuestionsAndAnswers();

  } catch (error) {
    console.error("Something Wrong Happened")
  }
});

async function grabQuestions() {
  await QuestionServices.getQuestion(quizID.value)
    .then((res) => {
      questionSet.value = res.data.map(newQuestion => ({
        id: newQuestion.id,
        questionText: newQuestion.questionText,
        quizId: newQuestion.quizId
      }));
    })
    .catch((error) => {
      console.error("Something Wrong Happened")
    });
};

async function grabAnswers(questionID) {
  await AnswerServices.getAnswer(questionID)
    .then((res) => {
      console.log(res);
      answerSet.value = res.data.map(newAnswer => ({
        id: newAnswer.id,
        answerText: newAnswer.answerText,
        isCorrect: newAnswer.isCorrect
      }));
    })
    .catch((error) => {
      console.error("Something Wrong Happened")
    });
};

async function sendQuestion() {
  socket.emit("question", {
    id: questionSet.value[currentQuestion.value].id,
    question: questionSet.value[currentQuestion.value].questionText,
    quizID: questionSet.value[currentQuestion.value].quizId
  });
};

async function sendAnswers() {
  socket.emit("answers", {
    quizID: quizID.value,
    answerSet: answerSet.value
  });
}

async function sendQuestionsAndAnswers() {
  await grabAnswers(questionSet.value[currentQuestion.value].id);
  sendQuestion();
  sendAnswers();
}

async function loadNextQuestion() {
  currentQuestion.value += 1;
  sendQuestionsAndAnswers();
}

</script>

<template>
  <v-card-actions>
    <v-btn variant="flat" color="primary" @click="loadNextQuestion()">next Question</v-btn>
  </v-card-actions>
</template>