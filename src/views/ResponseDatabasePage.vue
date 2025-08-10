
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
const quizId = ref('');
const quizType = ref('');
const selectedItem = ref({})
const isAddMenu = ref(false);
const searchQuery = ref('');
const snackbar = ref({
  value: false,
  color: "",
  text: "",
});

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
  // Get quiz ID
  let response = await QuizSessionServices.getQuizSession(quizSessionId.value)
  quizId.value = response.data.quizId;

  // Get quizType
  response = await QuizServices.getQuizById(quizId.value);
  quizType.value = response.data.type;

  // Get Responses and attach readable data
  const filter = {
    quizSessionId: quizSessionId.value
  }
  response = await Services.getItems(filter)
  const swapped = await Promise.all(
    response.data.map(getReadableText)
  );
  Item.value = swapped;
}

async function getReadableText(i) {
  // Note: can improve load speeds if we stored the found data
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

async function downloadQuizCSV() {
  // Get the answer key
  const response = await QuizServices.getAnswerKey(quizId.value)
  const questionIDs = [];
  const answerKeys = {};
  response.data.forEach((i) => {
    questionIDs.push(i.id);

    const getIds = i.answer.map(object => object.id)
    answerKeys[i.id] = getIds
  })

  // Get table of student responses
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

async function downloadPollCSV() {
  activateSnackbar("red", "Poll CSV Download not implemented")

  // All data needed for tallying the polls can be obtained here
  const tallies = tally();

  // Start creating CSV
  let csv = "";
  // Process each question
  Object.keys(tallies).forEach((questionText) => {
    // get the answer texts
    const answerTexts = Object.keys(tallies[questionText]);

    // get the tallies
    const answerTallies = [];
    answerTexts.forEach((aT, idx) => {
      answerTallies[idx] = tallies[questionText][aT]
    })

    // Add first row of the question table
    csv += questionText + "," + answerTexts.join(",");
    csv += "\n";

    // Add the tallies
    csv += "," + answerTallies.join(",");
    csv += "\n\n";
  })

  // Now download as a csv (referencing code from stackoverflow below)
  // https://stackoverflow.com/questions/58292771/downloading-a-csv-of-file-using-vue-and-js
  const anchor = document.createElement('a');
  anchor.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  anchor.target = '_blank';
  anchor.download = 'responses.csv';
  anchor.click();
}

function tally() {
  const answerTallies = {}; // answerTallies[questionId][answerId] = numAnswered
  Item.value.forEach((sRes) => {
    // If question hasn't been seen before, make space for it
    const questionId = sRes.questionText;
    if (answerTallies[questionId] == undefined) {
      answerTallies[questionId] = {};
    }

    // If answer hasn't been seen before, make space for it
    const answerId = sRes.answerText;
    if (answerTallies[questionId][answerId] == undefined) {
      answerTallies[questionId][answerId] = 0
    }

    answerTallies[questionId][answerId]++ // tally student's answer
  })

  return answerTallies;
}

</script>

<template>
  <h1 class="title">{{itemName}} Database</h1>

  <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn v-if="quizType=='quiz'" variant="flat" color="tertiary" @click="downloadQuizCSV()">
      Download Quiz
      <v-icon color="primary" class="cursor-pointer">mdi-arrow-down</v-icon>
    </v-btn>
    <v-btn v-if="quizType=='poll'" variant="flat" color="tertiary" @click="downloadPollCSV()">
      Download Poll
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