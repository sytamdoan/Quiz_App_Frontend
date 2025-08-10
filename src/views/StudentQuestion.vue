<script setup>
import { onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client';
import { ref, computed  } from "vue";
import { useRoute, useRouter } from "vue-router";
import QuizSessionServices from "../services/QuizSessionServices.js";
import QuizServices from '../services/QuizServices.js';


const socket = io(`http://${import.meta.env.VITE_DB_HOST}:3001`);
const router = useRouter();
const route = useRoute();
const quizSessionID = ref(0);
const currentQuestion = ref("");
const answerSet = ref({})
const selectedAnswer = ref();
const waitingForNextQuestion = ref(true);
const user = ref({});
const dialog = ref({
  open: false,
  mode: "alert",
  color: "primary",
  title: "",
  text: ""
});

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

function openConfirmationDialog() {
  if (selectedAnswer.value) {
    dialog.value = {
      open: true,
      mode: "confirm",
      color: "primary",
      title: "Confirm Submission",
      text: "Submit this answer now?"
    };
  } else {
    dialog.value = {
      open: true,
      mode: "alert",
      color: "red",
      title: "No Answer Selected",
      text: "Please select an answer before submitting."
    };
  }
}

function closeDialog() {
  dialog.value.open = false;
}

function submitAnswer() {
    dialog.value.open = false;
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

    <div class="timer" style="font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center;">
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
      <v-btn variant="flat" color="primary" @click="openConfirmationDialog" v-if="!waitingForNextQuestion" :disabled="timerUp">Submit</v-btn>
    </v-card-actions>

    <v-dialog v-model="dialog.open" max-width="420" persistent>
      <v-card>
        <v-card-title class="text-h6">{{ dialog.title }}</v-card-title>
        <v-card-text>{{ dialog.text }}</v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="closeDialog">Close</v-btn>

          <!-- Only show "Submit" when it's a confirm dialog AND an answer is selected -->
          <v-btn
            v-if="dialog.mode === 'confirm' && selectedAnswer"
            :color="dialog.color"
            variant="flat"
            @click="submitAnswer"
          >
            Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

</template>

<style scoped>
.timer {
  color: #1976d2;
}
</style>