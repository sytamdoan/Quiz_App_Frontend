<script setup>
import { onMounted } from 'vue'
import { io } from 'socket.io-client';
import { ref, computed  } from "vue";
import QuizSessionServices from "../services/QuizSessionServices.js";
import QuestionServices from "../services/QuestionServices.js";
import AnswerServices from "../services/AnswerServices.js";
import ResponseServices from "../services/ResponseServices.js"
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
const isSaveResponse = ref(true);
const responseBuffer = ref([]);
const missedResponses = ref([]);

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
      console.log(data);
      const sRes = {};
      sRes.userId = data.userId;
      sRes.answerId = data.answer.id;

      responseBuffer.value.push(sRes);
      console.log(responseBuffer.value);
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
      console.error("Something Wrong Happened")
    });
};

async function grabAnswers(questionID) {
  await AnswerServices.getAnswer(questionID)
    .then((res) => {
      answerSet.value = res.data.map(newAnswer => ({
        id: newAnswer.id,
        answerText: newAnswer.answerText,
//        isCorrect: newAnswer.isCorrect
      }));
      console.log(answerSet.value[0])
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
  if (isSaveResponse.value){
    await saveResponses();
  }
  isSaveResponse.value=true; // reset the checkbox

  currentQuestion.value += 1;
  socket.emit("nextQuestion", {
    quizSessionID: quizSessionID.value
  });
  sendQuestionsAndAnswers();
}

async function saveResponses(){
  const buffer = responseBuffer.value
  responseBuffer.value = [];

  await Promise.all(
    buffer.map(async (sRes) => {
      sRes.quizSessionId = quizSessionID.value;
      sRes.questionId = questionSet.value[currentQuestion.value].id;
      console.log(sRes);

      return ResponseServices.addItem(sRes)
        .catch((err) => {
          console.log("Could not add a response.")
          missedResponses.value.push(sRes);
        })
    }))

  console.log(missedResponses.value);
  console.log(responseBuffer.value)
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
  <v-card-actions>
    <v-btn v-if="hasNextQuestion" variant="flat" color="primary" @click="loadNextQuestion()">Next Question</v-btn>
    <v-btn variant="flat" color="primary" @click="endQuiz()">Finish Quiz</v-btn>
  </v-card-actions>
  <v-card-actions>
    <input type="checkbox" id="saveResponses" v-model="isSaveResponse"/>
    <label for="saveResponses">Save Responses upon Next Question</label>
  </v-card-actions>
</template>