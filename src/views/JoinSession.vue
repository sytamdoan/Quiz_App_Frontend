<script setup>
import { onMounted } from "vue";
import { ref, toRaw } from "vue";
import { useRouter } from "vue-router";
import UserServices from "../services/UserServices.js";
import QuizSessionServices from "../services/QuizSessionServices.js";
import QuizServices from "../services/QuizServices.js";


const confirmPassword = ref('')
const router = useRouter();
const isCreateAccount = ref(false);
const snackbar = ref({
  value: false,
  color: "",
  text: "",
});
const sessionID = ref("")
const sessionInfo = ref({
  sessionEntryCode: "",
});
const isRequireLogin = ref(false);

onMounted(async () => {
  const sessionCode = localStorage.getItem("sessionCode")
  if (sessionCode !== undefined){
    sessionInfo.value.sessionEntryCode = sessionCode
  }
});

function joinQuizSession() {
  const isEmptyField = Object.values(sessionInfo.value).some(
      (value) => value === null || value === '' || value === undefined
  );

  if (isEmptyField) {
    snackbar.value.value = true;
    snackbar.value.color = "red";
    snackbar.value.text = "All fields must be filled.";
    return;
  } else {
    localStorage.setItem("sessionCode", sessionInfo.value.sessionEntryCode)
    findSession();
  }
}

async function findSession() {
  await QuizSessionServices.findQuizSession(sessionInfo.value.sessionEntryCode)
  .then((res) => {
    sessionID.value = res.data.id;
    QuizServices.getQuizById(res.data.quizId)
    .then((res) => {
      // If quiz requires user to be logged in and user is not logged in, open redirect modal
      if (!res.data.isAnonymous && localStorage.getItem("user") === null) {
        isRequireLogin.value = true
      } else { // If anonymous or user logged in, proceed to quiz
        router.push({ name: "StudentQuestion", params: {quizSessionID: sessionID.value} });
      }
    })
    .catch((err) => {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = "Invalid code.";
      console.error("Unable to get Quiz")
      console.error(err)
    })
  })
  .catch((error) => {
    snackbar.value.value = true;
    snackbar.value.color = "red";
    snackbar.value.text = "Invalid code.";
    console.error("Quiz Session Doesn't Exist")
  });
}

function closeSnackBar() {
  snackbar.value.value = false;
}

function goToLogin() {
  router.push({ name: "login"});
}

function closeRequireLogin() {
  isRequireLogin.value = false;
}
</script>

<template>
  <v-container>
    <div id="body">
      <v-card class="rounded-lg elevation-5">
        <v-card-title class="headline mb-2">Join Session </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="sessionInfo.sessionEntryCode"
            label="Session Code"
            required
          ></v-text-field>

        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="flat" color="primary" @click="joinQuizSession()"
            >Join Session</v-btn
          >
        </v-card-actions>
      </v-card>

      <v-snackbar v-model="snackbar.value" rounded="pill">
        {{ snackbar.text }}

        <template v-slot:actions>
          <v-btn
            :color="snackbar.color"
            variant="text"
            @click="closeSnackBar()"
          >
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </div>
  </v-container>

  <v-dialog persistent v-model="isRequireLogin" width="800">
    <v-card class="rounded-lg elevation-5">
      <v-card-title class="headline mb-2">This Quiz Requires You To Be Logged In</v-card-title>
      <v-card-actions>
        <v-btn variant="flat" color="primary" @click="goToLogin()"
          >Go To Login</v-btn
        >
        <v-btn variant="flat" color="primary" @click="closeRequireLogin()"
          >Re-input Quiz Code</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
