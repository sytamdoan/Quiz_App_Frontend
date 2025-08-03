<script setup>
import { onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client';
import { ref, computed  } from "vue";
import { useRoute, useRouter } from "vue-router";
import QuizSessionServices from "../services/QuizSessionServices.js";
import QuizServices from '../services/QuizServices.js';


const socket = io('http://localhost:3001');
const router = useRouter();
const route = useRoute();
const quizSessionID = ref(0);
const currentQuestion = ref("");
const answerSet = ref({})
const selectedAnswer = ref();
const waitingForNextQuestion = ref(true);
const snackbar = ref({
  value: false,
  color: "",
  text: "",
});
const user = ref({});

const quiz = ref({ timeLimit: 20 });
const timeLeft = ref('00:00');
const remainingSeconds = ref(0);
let intervalId = null;
const timerUp = ref(false);

const updateTimeDisplay = () => {
  const minutes = Math.floor(remainingSeconds.value / 60);
  const seconds = remainingSeconds.value % 60;
  timeLeft.value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const startCountdown = () => {
  updateTimeDisplay();
  intervalId = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
      updateTimeDisplay();
    } else {
      clearInterval(intervalId);
      if (selectedAnswer.value) {
        submitAnswer(); // auto-submit
      } else {
        timerUp.value = true; // lock if unanswered
      }
    }
  }, 1000); //this forces the setInterval to run every 1000 ms
};

const resetCountdown = () => {
  clearInterval(intervalId);
  remainingSeconds.value = quiz.value.timeLimit;
  timerUp.value = false;
  startCountdown();
};

onMounted(async () => {
  if (localStorage.getItem("user") !== null) {
    user.value = JSON.parse(localStorage.getItem("user"));
    console.log("User is logged in.")
  } else {
    console.log("User is not logged in.");
  }

  try {
    quizSessionID.value = route.params.quizSessionID;
    console.log(route.params.quizSessionID);

    const sessionData = await QuizSessionServices.getQuizSession(quizSessionID.value);
    const quizId = sessionData.data.quizId;
    const quizData = await QuizServices.getQuizById(quizId);
    quiz.value = quizData.data;
    remainingSeconds.value = quiz.value.timeLimit;

    socket.on("connect", () => {
      console.log("Connnected To Backend From Student Side");
    })
    socket.on(quizSessionID.value + "question", (data) => {
      currentQuestion.value = data;
    })
    socket.on(quizSessionID.value + "answer", (data) => {
      answerSet.value = data;
      console.log(answerSet);
    })
    socket.on(quizSessionID.value + "end", (data) => {
      router.push({ name: "StudentEndQuizPage" });
    })
    socket.on(quizSessionID.value + "nextQuestion", (data) => {
      waitingForNextQuestion.value = false;
      selectedAnswer.value = null;
      resetCountdown(); //adding reset to start the question timer over
    })

  } catch (error) {
    console.log(error)
    console.error("Something went wrong")
  }
});

onUnmounted(() => {
  clearInterval(intervalId);
});

function closeSnackBar() {
    snackbar.value.value = false;
}

function openConfirmationBar() {
    if(selectedAnswer.value) {
        snackbar.value.color = "red";
        snackbar.value.text = "Submit This Answer?";
        snackbar.value.value = true;
    } else {
        snackbar.value.color = "red";
        snackbar.value.text = "Please Select An Answer";
        snackbar.value.value = true;
    }
}

function submitAnswer() {
    snackbar.value.value = false;
    socket.emit("response", {
        userId: user.value.id,
        quizSessionID: quizSessionID.value,
        answer: selectedAnswer.value,
    });
    selectedAnswer.value = null;
    waitingForNextQuestion.value = true;
}
</script>

<template>
    <h1 style="text-align: center;" v-if="!waitingForNextQuestion">{{ currentQuestion }}</h1>
    <h1 style="text-align: center;" v-if="waitingForNextQuestion">Please Wait for Instructor</h1>

    <div class="timer" style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">
      Time Left: {{ timeLeft }}
    </div>

    <v-radio-group v-model = "selectedAnswer" v-if="!waitingForNextQuestion" :disabled="timerUp">
        <v-radio
        v-for="answer in answerSet"
        :key="answer.id"
        :label="answer.answerText"
        :value="answer"
        />
    </v-radio-group>

    <v-card-actions>
        <v-btn variant="flat" color="primary" @click="openConfirmationBar()" v-if="!waitingForNextQuestion" :disabled="timerUp">Submit</v-btn>
    </v-card-actions>

    <v-snackbar v-model="snackbar.value" rounded="pill">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="closeSnackBar()"
        >
          Close
        </v-btn>
        <v-btn
          v-if="selectedAnswer"
          :color="snackbar.color"
          variant="text"
          @click="submitAnswer()"
        >
          Submit
        </v-btn>
      </template>
    </v-snackbar>
</template>

<style scoped>
.timer {
  color: #1976d2;
}
</style>