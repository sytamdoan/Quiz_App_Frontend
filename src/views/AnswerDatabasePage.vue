
<script setup>
import { onMounted } from 'vue'
import { ref, computed } from "vue";
import AnswerServices from "../services/AnswerServices.js";
import { useRoute } from "vue-router";

const Item = ref([])
const route = useRoute();
const myQuestionID = ref('')
const selectedItem = ref({})
const isUpdateItem = ref(false);
const addItemCheck = ref(false);
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
        String(row.answerText).toLowerCase().includes(keyword) 
      );
    });
  }
  return data
})

onMounted(async () => {
  try {
    myQuestionID.value = route.params.questionID;
    fetchData()
  } catch (error) {
    console.error("Cannot Fetch Answers: ", error)
  }
});

async function deleteItem(id) {
  await AnswerServices.deleteAnswer(id)
    .then(() => {
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "Quiz Deleted";
      fetchData()
    })
    .catch((error) => {
      console.error(error);
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = "Couldn't Delete Quiz";
    });
};

async function updateItem(id, Item) {
  await AnswerServices.updateAnswer(id, Item)
    .then(() => {
      fetchData()
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "Answer Updated";
      isUpdateItem.value = false;
    })
    .catch((error) => {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = "Something went wrong";
    });
};

async function addItem(Item) {
  await AnswerServices.addAnswer(myQuestionID.value, Item)
    .then(() => {
      fetchData()
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "Quiz Added";
      isUpdateItem.value = false;
    })
    .catch((error) => {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = "Error";
    });
};

async function fetchData() {
  const response = await AnswerServices.getAnswer(myQuestionID.value)
  Item.value = response.data
}

function openUpdateModal(Item, addItem) {
  addItemCheck.value = addItem;
    if(addItemCheck.value) {
    selectedItem.value = {};
  } else {
    selectedItem.value = {...Item}
  }
  isUpdateItem.value = true;
}

function closeUpdateModal() {
  isUpdateItem.value = false;
}

function closeSnackBar() {
  snackbar.value.value = false;
}
</script>

<template>
  <h1 class="title">Answer Database</h1>
  <v-text-field
    v-model="searchQuery"
    label="Search"
    required
  ></v-text-field>
  <v-table>
    <thead>
      <tr>
        <th class="text-left">ID</th>
        <th class="text-left">Answer Test</th>
        <th class="text-left">Is Correct</th>
        <th class="text-left">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="Item in filteredData" :key="Item.id" class="mb-2">
        <td class = "cursor-pointer" @click="openUpdateModal(Item, false)">{{ Item.id }}</td>
        <td class = "cursor-pointer" @click="openUpdateModal(Item, false)">{{ Item.answerText }}</td>
        <td class = "cursor-pointer" @click="openUpdateModal(Item, false)">{{ Item.isCorrect }}</td>
        <td>
          <!-- <a @click="" style="color: blue; cursor: pointer; text-decoration: underline;"> View Questions</a> -->
          |
          <v-icon color="red" class="cursor-pointer" @click="openUpdateModal(Item, false)"> mdi-pencil </v-icon>
          |
          <v-icon color="red" class="cursor-pointer" @click="deleteItem(Item.id)"> mdi-delete </v-icon>
        </td>
      </tr>
    </tbody>
  </v-table>
  <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn variant="flat" color="primary" @click="openUpdateModal(Item, true)">Add Answer</v-btn>
  </v-card-actions>

  <v-dialog persistent v-model="isUpdateItem" width="800">
    <v-card class="rounded-lg elevation-5">
      <v-card-title class="headline mb-2">Update Answer</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="selectedItem.name"
          label="Quiz Name"
          required
        ></v-text-field>

        <v-radio-group
          v-model="selectedItem.type"
          label="Quiz Type"
          required
        >
          <v-radio label = "Quiz" :value="'quiz'" />
          <v-radio label = "Poll" :value="'poll'" />
        </v-radio-group>

        <v-text-field
          v-model="selectedItem.subject"
          label="Quiz Subject"
          required
        ></v-text-field>

        <v-text-field
          v-model="selectedItem.timeLimit"
          label="Time Limit"
          type = "number"
          required
        ></v-text-field>

        <v-radio-group
          v-model="selectedItem.isResultsVisible"
          label="Are Results Visible?"
          required
        >
          <v-radio label = "Yes" :value="true" />
          <v-radio label = "No" :value="false" />
        </v-radio-group>

        <v-radio-group
          v-model="selectedItem.isAnonymous"
          label="Is This anonymous?"
          required
        >
          <v-radio label = "Yes" :value="true" />
          <v-radio label = "No" :value="false" />
        </v-radio-group>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="flat"
          color="secondary"
          @click="closeUpdateModal()"
          >Close</v-btn
        >
        <v-btn v-if="!addItemCheck" variant="flat" color="primary" @click="updateItem(selectedItem.id, selectedItem)"
          >Update Quiz</v-btn
        >
        <v-btn v-if="addItemCheck" variant="flat" color="primary" @click="addItem(selectedItem)"
          >Add Quiz</v-btn
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