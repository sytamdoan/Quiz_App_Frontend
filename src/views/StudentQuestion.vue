<script setup>
import { onMounted } from 'vue'
import { io } from 'socket.io-client';
import { ref, computed  } from "vue";
import { useRoute, useRouter } from "vue-router";
import QuizSessionServices from "../services/QuizSessionServices.js";


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
    })

  } catch (error) {
    console.log(error)
    console.error("Something went wrong")
  }
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

    <v-radio-group v-model = "selectedAnswer" v-if="!waitingForNextQuestion">
        <v-radio
        v-for="answer in answerSet"
        :key="answer.id"
        :label="answer.answerText"
        :value="answer"
        />
    </v-radio-group>

    <v-card-actions>
        <v-btn variant="flat" color="primary" @click="openConfirmationBar()" v-if="!waitingForNextQuestion">Submit</v-btn>
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