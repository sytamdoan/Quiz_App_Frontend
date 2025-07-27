
<script setup>
import { onMounted } from 'vue'
import { ref, computed } from "vue";
import Services from "../services/ResponseServices.js";
import { useRoute, useRouter } from "vue-router";

const itemName = "Response";
const Item = ref([])
const route = useRoute();
const router = useRouter();
const quizSessionId = ref('')
const selectedItem = ref({})
const isAddMenu = ref(false);
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
        String(row.quizSessionId).toLowerCase().includes(keyword) ||
        String(row.questionId).toLowerCase().includes(keyword) ||
        String(row.answerId).toLowerCase().includes(keyword) ||
        String(row.userId).toLowerCase().includes(keyword)
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
  const response = await Services.getItems(quizSessionId.value)
  Item.value = response.data
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
        <th class="text-left">quizSessionId</th>
        <th class="text-left">questionId</th>
        <th class="text-left">answerId</th>
        <th class="text-left">userId</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in filteredData" :key="item.id" class="mb-2">
        <td class="cursor-pointer">{{ item.id }}</td>
        <td class="cursor-pointer">{{ item.quizSessionId }}</td>
        <td class="cursor-pointer">{{ item.questionId }}</td>
        <td class="cursor-pointer">{{ item.answerId }}</td>
        <td class="cursor-pointer">{{ item.userId }}</td>
        <td>
          <v-icon color="red" class="cursor-pointer" @click="deleteItem(item.id)"> mdi-delete </v-icon>
        </td>
      </tr>
    </tbody>
  </v-table>
  <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn variant="flat" color="primary" @click="openAddMenu(item)">Add {{itemName}}</v-btn>
  </v-card-actions>

  <v-dialog persistent v-model="isAddMenu" width="800">
    <v-card class="rounded-lg elevation-5">
      <v-card-title class="headline mb-2">Update {{itemName}}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="selectedItem.quizSessionId"
          label="QuizSession ID"
          required
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