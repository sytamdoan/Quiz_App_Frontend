
<script setup>
import { onMounted } from 'vue'
import { ref, computed } from "vue";
import QuestionServices from "../services/QuestionServices.js";
import QuizServices from "../services/QuizServices.js";
import { useRoute, useRouter } from "vue-router";

const Question = ref([])
const route = useRoute();
const router = useRouter();
const myQuizID = ref('')
const selectedQuestion = ref({})
const isUpdateQuestion = ref(false);
const isEditable = ref(false);
const addQuestionCheck = ref(false);
const searchQuery = ref('');
const snackbar = ref({
  value: false,
  color: "",
  text: "",
});

const filteredData = computed(() => {
  let data = Question.value;
  let keyword = searchQuery.value.toLowerCase();
  if (keyword) {
    data = data.filter((row) => {
      return (
        String(row.id).toLowerCase().includes(keyword) ||
        String(row.questionText).toLowerCase().includes(keyword)
      );
    });
  }
  return data
})

onMounted(async () => {
  try {
    myQuizID.value = route.params.quizID;
    await QuizServices.getQuizById(myQuizID.value)
    .then((response) => {
      if(response.data != undefined)
        isEditable.value = response.data.isEditable
    });
    fetchQuestion()
  } catch (error) {
    console.error("Cannot Fetch Questions: ", error)
  }
});

async function deleteQuestion(id) {
  await QuestionServices.deleteQuestion(id)
    .then(() => {
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "Question Deleted";
      fetchQuestion()
    })
    .catch((error) => {
      console.error(error);
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = error.response.data.message;
    });
};

async function updateQuestion(id, Question) {
  await QuestionServices.updateQuestion(id, Question)
    .then(() => {
      fetchQuestion()
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "Question Updated";
      isUpdateQuestion.value = false;
    })
    .catch((error) => {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = error.response.data.message;
    });
};

async function addQuestion(Question) {
  await QuestionServices.addQuestion(myQuizID.value, Question)
    .then(() => {
      fetchQuestion()
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "Question Added";
      isUpdateQuestion.value = false;
    })
    .catch((error) => {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = error.response.data.message;
    });
};

async function fetchQuestion() {
  const response = await QuestionServices.getQuestion(myQuizID.value)
  Question.value = response.data
}

function openUpdateQuestion(Question, addQuestion) {
  if(isEditable)
    return;
  addQuestionCheck.value = addQuestion;
    if(addQuestionCheck.value) {
    selectedQuestion.value = {};
  } else {
    selectedQuestion.value = {...Question}
  }
  isUpdateQuestion.value = true;
}

function closeUpdateQuestion() {
  isUpdateQuestion.value = false;
}

function closeSnackBar() {
  snackbar.value.value = false;
}

function goToAnswerPage(questionID) {
  router.push({ name: "AnswerDatabasePage", params: {questionID: questionID} });
}
</script>

<template>
  <h1 class="title">Question Database</h1>
  <v-text-field
    v-model="searchQuery"
    label="Search"
    required
  ></v-text-field>
  <v-table>
    <thead>
      <tr>
        <th class="text-left">ID</th>
        <th class="text-left">Question Text</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="Question in filteredData" :key="Question.id" class="mb-2">
        <td class = "cursor-pointer" @click="openUpdateQuestion(Question, false)">{{ Question.id }}</td>
        <td class = "cursor-pointer" @click="openUpdateQuestion(Question, false)">{{ Question.questionText }}</td>
        <td v-if="isEditable">
          <a @click="goToAnswerPage(Question.id)" style="color: blue; cursor: pointer; text-decoration: underline;"> View Answers</a>
          |
          <v-icon color="red" class="cursor-pointer" @click="openUpdateQuestion(Question, false)"> mdi-pencil </v-icon>
          |
          <v-icon color="red" class="cursor-pointer" @click="deleteQuestion(Question.id)"> mdi-delete </v-icon>
        </td>
        <td v-else>
          <a @click="goToAnswerPage(Question.id)" style="color: blue; cursor: pointer; text-decoration: underline;"> View Answers</a>
          |
          Not Editable
        </td>
      </tr>
    </tbody>
  </v-table>
  <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn v-if="isEditable" variant="flat" color="primary" @click="openUpdateQuestion(Question, true)">Add Question</v-btn>
  </v-card-actions>

  <v-dialog persistent v-model="isUpdateQuestion" width="800">
    <v-card class="rounded-lg elevation-5">
      <v-card-title class="headline mb-2">Update Question</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="selectedQuestion.questionText"
          label="Question Text"
          required
        ></v-text-field>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="flat"
          color="secondary"
          @click="closeUpdateQuestion()"
          >Close</v-btn
        >
        <v-btn v-if="!addQuestionCheck" variant="flat" color="primary" @click="updateQuestion(selectedQuestion.id, selectedQuestion)"
          >Update Question</v-btn
        >
        <v-btn v-if="addQuestionCheck" variant="flat" color="primary" @click="addQuestion(selectedQuestion)"
          >Add Question</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
  
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
</template>

<style scoped>
.title {
  text-align: center;
  margin: 0.5rem 0;
  font-weight: 600;
}
</style>