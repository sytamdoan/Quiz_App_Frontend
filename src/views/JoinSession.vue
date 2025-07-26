<script setup>
import { onMounted } from "vue";
import { ref, toRaw } from "vue";
import { useRouter } from "vue-router";
import UserServices from "../services/UserServices.js";
import QuizSessionServices from "../services/QuizSessionServices.js";


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

function joinQuizSession() {
  const isEmptyField = Object.values(sessionInfo.value).some(
      (value) => value === null || value === '' || value === undefined
  );

  if (isEmptyField) {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = "All fields must be filled.";
      return;
  }
  findSession();
}

async function findSession() {
  await QuizSessionServices.findQuizSession(sessionInfo.value.sessionEntryCode)
  .then((res) => {
    sessionID.value = res.data.id;
    console.log("Quiz Session Grabbed")
    router.push({ name: "StudentQuestion", params: {quizSessionID: sessionID.value} });

  })
  .catch((error) => {
      console.error("Quiz Session Doesn't Exist")
  });
}

function closeSnackBar() {
  snackbar.value.value = false;
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
</template>
