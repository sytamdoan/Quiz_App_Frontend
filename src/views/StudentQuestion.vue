<script setup>
import { onMounted } from 'vue'
import { io } from 'socket.io-client';
import { ref, computed  } from "vue";

const socket = io('http://localhost:3001');
const quizSessionID = ref(1);
const currentQuestion = ref("");
const answerSet = ref({})
const selectedAnswer = ref();

onMounted(async () => {
  try {
    socket.on("connect", () => {
      console.log("Connnected To Backend From Student Side");
    })
    socket.on(quizSessionID.value + "question", (data) => {
      currentQuestion.value = data;
    })

    socket.on(quizSessionID.value + "answer", (data) => {
      answerSet.value = data;
    })

  } catch (error) {
    console.error("Something went wrong")
  }
});

</script>

<template>
    <h1 style="text-align: center;">{{ currentQuestion }}</h1>

    <v-radio-group v-model = "selectedAnswer" >
        <v-radio
        v-for="answer in answerSet"
        :key="answer.id"
        :label="answer.answerText"
        :value="answer.id"
        />
    </v-radio-group>

</template>