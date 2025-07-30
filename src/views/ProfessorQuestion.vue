<script setup>
import { onMounted } from 'vue'
import { io } from 'socket.io-client';
import { ref, computed  } from "vue";
import QuizSessionServices from "../services/QuizSessionServices.js";
import QuestionServices from "../services/QuestionServices.js";
import AnswerServices from "../services/AnswerServices.js";
import { useRoute, useRouter } from "vue-router";

const socket = io('http://localhost:3001');
const route = useRoute();
const router = useRouter();
const quizSessionID = ref('');
const quizID = ref('');
const questionSet = ref({})
const answerSet = ref({})
const currentQuestion = ref(0)
const responseMap = ref(new Map());
const hasNextQuestion = computed(() => {
  return currentQuestion.value < (questionSet.value.length - 1);
});

onMounted(async () => {
  try {
    quizSessionID.value = route.params.quizSessionID;
    await grabQuizSession();
  } catch (error) {
    console.error("Cannot Fetch QuizSessionId: ", error)
  }
  try {
    socket.on("connect", () => {
      console.log("Connnected To Backend From Professor");
    })
    socket.on(quizSessionID.value + "response", (data) => {
      tallyResponse(data);
    })

    socket.emit("nextQuestion", {
      quizSessionID: quizSessionID.value
    });
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
      console.log(questionSet.value[0])
    })
    .catch((error) => {
      console.error("Something Wrong Happened")
    });
};

async function grabQuizSession() {
  await QuizSessionServices.getQuizSession(quizSessionID.value)
    .then((res) => {
      quizID.value = res.data.quizId;
    })
    .catch((error) => {
      console.log(error);
      console.error("Something Wrong Happened")
    });
};

async function grabAnswers(questionID) {
  await AnswerServices.getAnswer(questionID)
    .then((res) => {
      answerSet.value = res.data.map(newAnswer => ({
        id: newAnswer.id,
        answerText: newAnswer.answerText,
        isCorrect: newAnswer.isCorrect
      }));

      res.data.forEach(newAnswer => {
        responseMap.value.set(newAnswer.answerText, 0);
      });
    })
    .catch((error) => {
      console.error("Something Wrong Happened")
    });
};

async function sendQuestion() {
  socket.emit("question", {
    quizSessionID: quizSessionID.value,
    id: questionSet.value[currentQuestion.value].id,
    question: questionSet.value[currentQuestion.value].questionText,
    quizID: questionSet.value[currentQuestion.value].quizId
  });
};

async function sendAnswers() {
  socket.emit("answers", {
    quizSessionID: quizSessionID.value,
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
  socket.emit("nextQuestion", {
    quizSessionID: quizSessionID.value
  });
  responseMap.value.clear();
  sendQuestionsAndAnswers();
}


async function tallyResponse(response) {
  if(!responseMap.value.has(response.answerText)) {
    responseMap.value.set(response.answerText, 1);
  } else {
    const currentResponseValue = responseMap.value.get(response.answerText);
    responseMap.value.set(response.answerText,currentResponseValue + 1);
  }
}

async function endQuiz() {
  await QuizSessionServices.endQuizSession(quizSessionID.value)
    .then((res) => {
      console.log("Quiz has ended")
      socket.emit("end", {
        quizSessionID: quizSessionID.value
      });
      router.push({ name: "ProfessorEndQuizPage"});
    })
    .catch((error) => {
      console.log(error);
      console.error("Something Wrong Happened")
    });
}

</script>

<template>

  <p v-for="[response ,value] in Array.from(responseMap)" :response="response">
    {{ response }} : {{ value }}
  </p>

  <v-card-actions>
    <v-btn v-if="hasNextQuestion" variant="flat" color="primary" @click="loadNextQuestion()">next Question</v-btn>
    <v-btn variant="flat" color="primary" @click="endQuiz()">Finish Quiz</v-btn>
  </v-card-actions>
</template>