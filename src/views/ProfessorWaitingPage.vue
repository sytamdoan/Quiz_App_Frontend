<script setup>
import { onMounted } from 'vue'
import { ref, computed  } from "vue";
import QuizSessionServices from "../services/QuizSessionServices.js";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const quizSessionID = ref('');
const route = useRoute();
const entryCode = ref('');

onMounted(async () => {
  try {
    quizSessionID.value = route.params.quizSessionID;
    grabQuizSession()
  } catch (error) {
    console.error("Cannot Fetch QuizSessionId: ", error)
  }
});

async function grabQuizSession() {
  await QuizSessionServices.getQuizSession(quizSessionID.value)
    .then((res) => {
        entryCode.value = res.data.entryCode;
        console.log("Quiz Session Entry Code Grabbed")
    })
    .catch((error) => {
        console.log(error);
        console.error("Something Wrong Happened")
    });
};

async function beginQuiz() {
    router.push({ name: "ProfessorQuestion", params: {quizSessionID: quizSessionID.value.id} });
}

</script>


<template>
    <h3 style="text-align: center;">Please Use the Classcode below to Join</h3>
    <h1 style="text-align: center;">{{entryCode}}</h1>
    <v-card-actions>
        <v-btn variant="flat" color="primary" @click="beginQuiz()">Begin Quiz</v-btn>
    </v-card-actions>

</template>