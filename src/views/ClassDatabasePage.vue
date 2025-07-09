
<script setup>
import { onMounted } from 'vue'
import { ref, computed } from "vue";
import ClassServices from "../services/ClassServices.js";

const Classs = ref([])
const columns = ref(["ID","FirstName","MiddleName","LastName"])
const selectedClass = ref({})
const isUpdateClass = ref(false);
const addClassCheck = ref(false);
const searchQuery = ref('');
const snackbar = ref({
  value: false,
  color: "",
  text: "",
});

const filteredData = computed(() => {
  let data = Classs.value;
  let keyword = searchQuery.value.toLowerCase();
  if (keyword) {
    data = data.filter((row) => {
      return (
        String(row.id).toLowerCase().includes(keyword) ||
        String(row.name).toLowerCase().includes(keyword) ||
        String(row.year).toLowerCase().includes(keyword)
      );
    });
  }
  return data
})

onMounted(async () => {
  try {
    fetchClass()
  } catch (error) {
    console.error("Cannot Fetch Classes: ", error)
  }
});

async function deleteClass(id) {
  await ClassServices.deleteClass(id)
    .then(() => {
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "Class Deleted";
      fetchClass()
    })
    .catch((error) => {
      console.error(error);
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = "Couldn't Delete Class";
    });
};

async function updateClass(id, Class) {
  await ClassServices.updateClass(id, Class)
    .then(() => {
      fetchClass()
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "Class Updated";
      isUpdateClass.value = false;
    })
    .catch((error) => {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = "Last Name cannot be empty";
    });
};

async function addClass(Class) {
  await ClassServices.addClass(Class)
    .then(() => {
      fetchClass()
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "Class Added";
      isUpdateClass.value = false;
    })
    .catch((error) => {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = "Error";
    });
};

async function fetchClass() {
  const response = await ClassServices.getClass()
  Classs.value = response.data
}

function openUpdateClass(Class, addClass) {
  addClassCheck.value = addClass;
  if(addClassCheck.value) {
    selectedClass.value = {};
  } else {
    selectedClass.value = {...Class}
  }
  isUpdateClass.value = true;
}

function closeUpdateClass() {
  isUpdateClass.value = false;
}

function closeSnackBar() {
  snackbar.value.value = false;
}
</script>

<template>
  <h1 class="title">Class Database</h1>
  <v-text-field
    v-model="searchQuery"
    label="Search"
    required
  ></v-text-field>
  <v-table>
    <thead>
      <tr>
        <th class="text-left">ID</th>
        <th class="text-left">Name</th>
        <th class="text-left">Year</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="Class in filteredData" :key="Class.id" class="mb-2">
        <td class = "cursor-pointer" @click="openUpdateClass(Class, false)">{{ Class.id }}</td>
        <td class = "cursor-pointer" @click="openUpdateClass(Class, false)">{{ Class.name }}</td>
        <td class = "cursor-pointer" @click="openUpdateClass(Class, false)">{{ Class.year }}</td>
        <td>
          <a @click="" style="color: blue; cursor: pointer; text-decoration: underline;"> View Quizzes</a>
          |
          <v-icon color="red" class="cursor-pointer" @click="openUpdateClass(Class, false)"> mdi-pencil </v-icon>
          |
          <v-icon color="red" class="cursor-pointer" @click="deleteClass(Class.id)"> mdi-delete </v-icon>
        </td>
      </tr>
    </tbody>
  </v-table>
  <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn variant="flat" color="primary" @click="openUpdateClass(Class, true)">Add Class</v-btn>
  </v-card-actions>

  <v-dialog persistent v-model="isUpdateClass" width="800">
    <v-card class="rounded-lg elevation-5">
      <v-card-title class="headline mb-2">Update Class</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="selectedClass.name"
          label="Class Name"
          required
        ></v-text-field>

        <v-text-field
          v-model="selectedClass.year"
          label="Class Year"
          required
        ></v-text-field>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="flat"
          color="secondary"
          @click="closeUpdateClass()"
          >Close</v-btn
        >
        <v-btn v-if="!addClassCheck" variant="flat" color="primary" @click="updateClass(selectedClass.id, selectedClass)"
          >Update Class</v-btn
        >
        <v-btn v-if="addClassCheck" variant="flat" color="primary" @click="addClass(selectedClass)"
          >Add Class</v-btn
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