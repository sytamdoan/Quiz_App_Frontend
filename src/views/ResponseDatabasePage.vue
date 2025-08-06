
<script setup>
import { onMounted } from 'vue'
import { ref, computed } from "vue";
import Services from "../services/ResponseServices.js";
import { useRoute, useRouter } from "vue-router";

// For swapping IDs with readable data
import UserServices from "../services/UserServices.js"
import QuizServices from "../services/QuizServices.js"
import QuizSessionServices from "../services/QuizSessionServices.js"
import QuestionServices from "../services/QuestionServices.js"
import AnswerServices from '../services/AnswerServices.js';

const itemName = "Response";
const Item = ref([])
const route = useRoute();
const quizSessionId = ref('')
const selectedItem = ref({})
const isAddMenu = ref(false);
const searchQuery = ref('');
const snackbar = ref({
  value: false,
  color: "",
  text: "",
});

// For swapping IDs with readable data
const userData = ref([]);
const questionData = ref([]);
const answerData = ref([]);

const filteredData = computed(() => {
  let data = Item.value;
  let keyword = searchQuery.value.toLowerCase();
  if (keyword) {
    data = data.filter((row) => {
      return (
        String(row.id).toLowerCase().includes(keyword) ||
        String(row.questionText).toLowerCase().includes(keyword) ||
        String(row.answerText).toLowerCase().includes(keyword) ||
        String(row.userNames).toLowerCase().includes(keyword)
      );
    });
  }
  return data
})

onMounted(async () => {
  try {
    quizSessionId.value = route.params.quizSessionID;
    fetchItems()
  } catch (error) {
    console.error("Cannot Fetch " + itemName + ": ", error)
  }
});

function activateSnackbar(color, text){
  snackbar.value.value = true;
  snackbar.value.color = color;
  snackbar.value.text = text;
}

async function deleteItem(id) {
  await Services.deleteItem(id)
    .then(() => {
      activateSnackbar("green", itemName + " Deleted");
      fetchItems()
    })
    .catch((error) => {
      console.error(error);
      activateSnackbar("red", error.response.data.message)
    });
};

async function addItem(Item) {
  Item.quizSessionId = quizSessionId.value
  await Services.addItem(Item)
    .then(() => {
      fetchItems()
      activateSnackbar("green", itemName + " Added");
      isAddMenu.value = false;
    })
    .catch((error) => {
      console.error(error);
      activateSnackbar("red", error.response.data.message)
    });
};

async function fetchItems() {
  const filter = {
    quizSessionId: quizSessionId.value
  }
  const response = await Services.getItems(filter)
  // Swap IDs for readable data
  // Note: can improve load speeds if we stored the found data
  const swapped = await Promise.all(
    response.data.map(async (i) => {
      let userNames = "";
      let questionText = "";
      let answerText = "";

      // Get the user's first and last name
      if (i.userId !== null) {
        const res = await UserServices.getUserNames(i.userId)
        userNames = res.data.firstName + " " + res.data.lastName
      }
      
      // Get the question text
      if (i.questionId !== null) {
        const res = await QuestionServices.getOneQuestion(i.questionId)
        questionText = res.data.questionText
      }

      // Get the answer text
      if (i.answerId !== null) {
        const res = await AnswerServices.getOneAnswer(i.answerId)
        answerText = res.data.answerText
      }
      
      return {
        ...i,
        userNames,
        questionText,
        answerText
      }

    })
  );

  Item.value = swapped;
}

function openAddMenu(Item) {
  selectedItem.value = {};
  isAddMenu.value = true;
}

function closeAddMenu() {
  isAddMenu.value = false;
}

function closeSnackBar() {
  snackbar.value.value = false;
}

async function downloadResponses() {
  activateSnackbar("blue", "Download placeholder.");
  // (blank), Question ID, questionId, questionId, questionId
  // (blank), Answer Key, answerIds, answerIds, answerIds
  // score, StudentName, answerId, answerId, answerId
  // score, StudentName, answerId, answerId, answerId
  // score, StudentName, answerId, answerId, answerId
  // ...

  // Get the ids of the questions
  const questionIDs = new Set();
  Item.value.forEach((item) => {
    questionIDs.add(item.questionId)
  })

  // Get correct answers
  // TODO: Insert new service that gets the list of correct answers for each question
  const answerKeys = {}
  for (const item of questionIDs) {
    const filter = {
      questionId: item,
      isCorrect: 1
    }
    const response = await AnswerServices.getAnswersWithFilter(filter)
      .catch((error) => {
        console.error(error);
        activateSnackbar("red", error.response.data.message)
      });
    answerKeys[item] = response.data.map(object => object.id) // response.data.answerIDs
    console.log(answerKeys);
  }

  // Populate table with correct data
  const studentData = {}
  Item.value.forEach((item) => {
    // Check if studentId exists
    if (item.userId == null) {
      return
    }

    // Add student row if it doesn't exist
    if (studentData[item.userId] == undefined)
    {
      studentData[item.userId] = {name: item.userNames, score: 0};
    }

    let student = studentData[item.userId];
    student[item.questionId] = item.answerId; // Insert their response
    if (answerKeys[item.questionId].includes(item.answerId))
    {
      student.score++;
    }
  })

  // Convert each piece of data into arrays
  let arrQuestionIDs = [...questionIDs];
  let arrAnswerKeys = [];
  arrQuestionIDs.forEach((questionId, idx) => { // get data for column
    arrAnswerKeys[idx] = answerKeys[questionId].join(" or ");
  })
  let arrStudentData = [];
  Object.keys(studentData).forEach((key) => {
    let student = studentData[key];
    let newStudentRow = [];
    newStudentRow.push(student.score);
    newStudentRow.push(student.name);
    arrQuestionIDs.forEach((questionId, idx) => {
      newStudentRow[idx+2] = student[questionId] || "n/a";
    })

    arrStudentData.push(newStudentRow);
  })

  // Start creating CSV
  let csv = ",Question IDs:,";
  csv+= arrQuestionIDs.join(",") + "\n";

  csv+= ",Answer Key:,";
  csv+= arrAnswerKeys.join(",") + "\n";

  csv+= "\n"
  csv+= "Number Correct (/"+arrQuestionIDs.length+"),Student Name,Their Answers by ID\n"

  arrStudentData.forEach((row) => {
    csv+=row.join(",") + "\n"
  })

  // Now download as a csv (referencing code from stackoverflow below)
  // https://stackoverflow.com/questions/58292771/downloading-a-csv-of-file-using-vue-and-js
  const anchor = document.createElement('a');
  anchor.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  anchor.target = '_blank';
  anchor.download = 'responses.csv';
  anchor.click();
}

</script>

<template>
  <h1 class="title">{{itemName}} Database</h1>

  <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn variant="flat" color="tertiary" @click="downloadResponses">
      <v-icon color="primary" class="cursor-pointer">mdi-arrow-down</v-icon>
    </v-btn>
    <v-btn variant="flat" color="primary" @click="openAddMenu(item)">Add {{itemName}}</v-btn>
  </v-card-actions>
  <v-text-field
    v-model="searchQuery"
    label="Search"
    required
  ></v-text-field>

  <v-table>
    <thead>
      <tr>
        <th class="text-left">ID</th>
        <th class="text-left">Question</th>
        <th class="text-left">Answer</th>
        <th class="text-left">User</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in filteredData" :key="item.id" class="mb-2">
        <td class="cursor-pointer">{{ item.id }}</td>
        <td class="cursor-pointer" :title="'id='+item.questionId">{{ item.questionText }}</td>
        <td class="cursor-pointer" :title="'id='+item.answerId">{{ item.answerText }}</td>
        <td class="cursor-pointer" :title="'id='+item.userId">{{ item.userNames }}</td>
        <td>
          <v-icon color="red" class="cursor-pointer" @click="deleteItem(item.id)"> mdi-delete </v-icon>
        </td>
      </tr>
    </tbody>
  </v-table>

  <v-dialog persistent v-model="isAddMenu" width="800">
    <v-card class="rounded-lg elevation-5">
      <v-card-title class="headline mb-2">Update {{itemName}}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="quizSessionId"
          label="QuizSession ID"
          readonly
        ></v-text-field>

        <v-text-field
          v-model="selectedItem.questionId"
          label="Question ID"
          required
        ></v-text-field>

        <v-text-field
          v-model="selectedItem.answerId"
          label="Answer ID"
          required
        ></v-text-field>

        <v-text-field
          v-model="selectedItem.userId"
          label="User ID"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="flat"
          color="secondary"
          @click="closeAddMenu()"
          >Close</v-btn
        >
        <v-btn variant="flat" color="primary" @click="addItem(selectedItem)"
          >Add {{itemName}}</v-btn
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