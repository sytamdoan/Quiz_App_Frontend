
<script setup>
import { onMounted } from 'vue'
import { ref, computed } from "vue";
import QuizSessionServices from "../services/QuizSessionServices.js";
import { useRoute, useRouter } from "vue-router";

const QuizSession = ref([])
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

const filteredData = computed(() => {
  let data = QuizSession.value;
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
    fetchQuizSession()
  } catch (error) {
    console.error("Cannot Fetch QuizSessions: ", error)
  }
});

async function deleteItem(id) {
  await QuizSessionServices.deleteQuizSession(id)
    .then(() => {
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "QuizSession Deleted";
      fetchQuizSession()
    })
    .catch((error) => {
      console.error(error);
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = error.response.data.message;
    });
};

async function updateItem(id, QuizSession) {
  await QuizSessionServices.updateQuizSession(id, QuizSession)
    .then(() => {
      fetchQuizSession()
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "QuizSession Updated";
      isUpdateItem.value = false;
    })
    .catch((error) => {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = error.response.data.message;
    });
};

async function addQuizSession(QuizSession) {
  await QuizSessionServices.addQuizSession(myQuizID.value, QuizSession)
    .then(() => {
      fetchQuizSession()
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "QuizSession Added";
      isUpdateItem.value = false;
    })
    .catch((error) => {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = error.response.data.message;
    });
};

async function fetchQuizSession() {
  const response = await QuizSessionServices.getQuizSession(myQuizID.value)
  QuizSession.value = response.data
}

function openUpdateItem(QuizSession, addQuizSession) {
  addItemCheck.value = addQuizSession;
    if(addItemCheck.value) {
    selectedItem.value = {};
  } else {
    selectedItem.value = {...QuizSession}
  }
  isUpdateItem.value = true;
}

function closeUpdateItem() {
  isUpdateItem.value = false;
}

function closeSnackBar() {
  snackbar.value.value = false;
}

</script>

<template>
  <h1 class="title">QuizSession Database</h1>
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
      <tr v-for="QuizSession in filteredData" :key="QuizSession.id" class="mb-2">
        <td class = "cursor-pointer" @click="openUpdateItem(QuizSession, false)">{{ QuizSession.id }}</td>
        <td class = "cursor-pointer" @click="openUpdateItem(QuizSession, false)">{{ QuizSession.entryCode }}</td>
        <td class = "cursor-pointer" @click="openUpdateItem(QuizSession, false)">{{ QuizSession.isActive }}</td>
        <td class = "cursor-pointer" @click="openUpdateItem(QuizSession, false)">{{ QuizSession.expirationDate }}</td>
        <td>
          <v-icon color="red" class="cursor-pointer" @click="openUpdateItem(QuizSession, false)"> mdi-pencil </v-icon>
          |
          <v-icon color="red" class="cursor-pointer" @click="deleteItem(QuizSession.id)"> mdi-delete </v-icon>
        </td>
      </tr>
    </tbody>
  </v-table>
  <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn variant="flat" color="primary" @click="openUpdateItem(QuizSession, true)">Add QuizSession</v-btn>
  </v-card-actions>

  <v-dialog persistent v-model="isUpdateItem" width="800">
    <v-card class="rounded-lg elevation-5">
      <v-card-title class="headline mb-2">Update QuizSession</v-card-title>
      <v-card-text>
        <v-text-field
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

        <template v-slot:activator="{ on, attrs }">
          <v-text-field
            v-model="selectedItem.expirationDate"
            label="Expiration Date"
            readonly
            v-on="on"
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
          >Update QuizSession</v-btn
        >
        <v-btn v-if="addItemCheck" variant="flat" color="primary" @click="addQuizSession(selectedItem)"
          >Add QuizSession</v-btn
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