
<script setup>
import { onMounted } from 'vue'
import { ref, computed } from "vue";
import Services from "../services/QuizSessionServices.js";
import { useRoute, useRouter } from "vue-router";
import QuizServices from '../services/QuizServices.js';

const itemName = "Quiz Session";
const Item = ref([])
const route = useRoute();
const router = useRouter();
const myQuizID = ref('')
const selectedItem = ref({})
const isUpdateItem = ref(false);
const addItemCheck = ref(false);
const searchQuery = ref('');
const snackbar = ref({
  value: false,
  color: "",
  text: "",
});
const dateMenu = ref(false);

const filteredData = computed(() => {
  let data = Item.value;
  let keyword = searchQuery.value.toLowerCase();
  if (keyword) {
    data = data.filter((row) => {
      return (
        String(row.id).toLowerCase().includes(keyword) ||
        String(row.entryCode).toLowerCase().includes(keyword) ||
        String(row.isActive).toLowerCase().includes(keyword) ||
        String(row.expirationDate).toLowerCase().includes(keyword)
      );
    });
  }
  return data
})

onMounted(async () => {
  try {
    myQuizID.value = route.params.quizID;
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

async function updateItem(id, itemData) {
  await Services.updateItem(id, itemData)
    .then(() => {
      fetchItems()
      activateSnackbar("green", itemName + " Updated");
      isUpdateItem.value = false;
    })
    .catch((error) => {
      console.error(error);
      activateSnackbar("red", error.response.data.message)
    });
};

async function addItem(Item) {
  // Lock quiz when making the session
  await QuizServices.lockQuiz()

  const newSession = {
    quizId: myQuizID.value,
    isActive: Item.isActive
  }
  await Services.addQuizSession(newSession)
    .then(() => {
      fetchItems()
      activateSnackbar("green", itemName + " Added");
      isUpdateItem.value = false;
    })
    .catch((error) => {
      console.error(error);
      activateSnackbar("red", error.response.data.message)
    });
};

async function fetchItems() {
  const response = await Services.getItems(myQuizID.value)
  Item.value = response.data
}

function openUpdateItem(Item, isAdding) {
  addItemCheck.value = isAdding;
  if(addItemCheck.value) {
    selectedItem.value = {};
  } else {
    selectedItem.value = {...Item}
  }
  isUpdateItem.value = true;
}

function closeUpdateItem() {
  isUpdateItem.value = false;
}

function closeSnackBar() {
  snackbar.value.value = false;
}

function goToResponseDatabasePage(QuizSessionID) {
  router.push({ name: "ResponseDatabasePage", params: {quizSessionID: QuizSessionID} });
}
</script>

<template>
  <h1 class="title">{{itemName}} Database</h1>
  <v-text-field
    v-model="searchQuery"
    label="Search"
    required
  ></v-text-field>

  <v-table>
    <thead>
      <tr>
        <th class="text-left">ID</th>
        <th class="text-left">Entry Code</th>
        <th class="text-left">Is Active</th>
        <th class="text-left">Expiration Date</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in filteredData" :key="item.id" class="mb-2">
        <td class = "cursor-pointer" @click="openUpdateItem(item, false)">{{ item.id }}</td>
        <td class = "cursor-pointer" @click="openUpdateItem(item, false)">{{ item.entryCode }}</td>
        <td class = "cursor-pointer" @click="openUpdateItem(item, false)">{{ item.isActive }}</td>
        <td class = "cursor-pointer" @click="openUpdateItem(item, false)">{{ item.expirationDate }}</td>
        <td>
          <a @click="goToResponseDatabasePage(item.id)" style="color: blue; cursor: pointer; text-decoration: underline;">View Responses</a>
          |
          <v-icon color="red" class="cursor-pointer" @click="openUpdateItem(item, false)"> mdi-pencil </v-icon>
          |
          <v-icon color="red" class="cursor-pointer" @click="deleteItem(item.id)"> mdi-delete </v-icon>
        </td>
      </tr>
    </tbody>
  </v-table>
  
  <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn variant="flat" color="primary" @click="openUpdateItem(item, true)">Add {{itemName}}</v-btn>
  </v-card-actions>

  <v-dialog persistent v-model="isUpdateItem" width="800">
    <v-card class="rounded-lg elevation-5">
      <v-card-title v-if="addItemCheck" class="headline mb-2">Add {{itemName}}</v-card-title>
      <v-card-title v-else class="headline mb-2">Update {{itemName}}</v-card-title>
      <v-card-text>
        <v-text-field
          v-if="!addItemCheck"
          v-model="selectedItem.entryCode"
          label="Entry Code"
          required
        ></v-text-field>

        <v-radio-group v-if="!addItemCheck"
          v-model="selectedItem.isActive"
          label="IsActive"
          required
        >
          <v-radio label = "Active" :value="true" />
          <v-radio label = "Inactive" :value="false" />
        </v-radio-group>

        <v-menu
          v-if="!addItemCheck"
          v-model="dateMenu"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          max-width="290px"
          min-width="auto"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="selectedItem.expirationDate"
              label="Expiration Date"
              readonly
              v-bind="attrs"
              @click="dateMenu = true"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="selectedItem.expirationDate"
            scrollable
            :show-current="true"
          >
            <template v-slot:actions>
              <v-btn text color="primary" @click="dateMenu = false">OK</v-btn>
            </template>
          </v-date-picker>
        </v-menu>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="flat"
          color="secondary"
          @click="closeUpdateItem()"
          >Close</v-btn
        >
        <v-btn v-if="!addItemCheck" variant="flat" color="primary" @click="updateItem(selectedItem.id, selectedItem)"
          >Update {{itemName}}</v-btn
        >
        <v-btn v-if="addItemCheck" variant="flat" color="primary" @click="addItem(selectedItem)"
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