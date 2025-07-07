<script setup>
import { onMounted } from 'vue'
import { ref, computed  } from "vue";
import UserServices from "../services/UserServices.js";

const users = ref([])
const selectedUser = ref({})
const isUpdateUser = ref(false);
const searchQuery = ref('');
const snackbar = ref({
  value: false,
  color: "",
  text: "",
});

const filteredData = computed(() => {
  let data = users.value;
  let keyword = searchQuery.value.toLowerCase();
  if (keyword) {
    data = data.filter((row) => {
      return (
        String(row.id).toLowerCase().includes(keyword) ||
        String(row.firstName).toLowerCase().includes(keyword) ||
        String(row.lastName).toLowerCase().includes(keyword) ||
        String(row.email).toLowerCase().includes(keyword) ||
        String(row.role).toLowerCase().includes(keyword)
      );
    });
  }
  return data
})

onMounted(async () => {
  try {
    fetchUsers()
  } catch (error) {
    console.error("Cannot Fetch Users: ", error)
  }
});

async function deleteUser(id) {
  await UserServices.deleteUser(id)
    .then(() => {
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "User Deleted";
      fetchUsers()
    })
    .catch((error) => {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = "Couldn't Delete User";
    });
};

async function updateUser(id, User) {

  const isEmptyField = Object.values(User).some(
    (value) => value === null || value === '' || value === undefined
  );

  if (isEmptyField) {
    snackbar.value.value = true;
    snackbar.value.color = "red";
    snackbar.value.text = "All fields must be filled.";
    return; 
  }
  await UserServices.updateUser(id, User)
    .then(() => {
      fetchUsers()
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "User Updated";
      isUpdateUser.value = false;
    })
    .catch((error) => {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = "Couldn't Update User";
    });
};

async function fetchUsers() {
  const response = await UserServices.getUser()
  users.value = response.data
}

function openUpdateUser(user) {
  selectedUser.value = {...user}
  isUpdateUser.value = true;
}

function closeUpdateUser() {
  isUpdateUser.value = false;
}

function closeSnackBar() {
  snackbar.value.value = false;
}

</script>

<template>
  <h1 class="title">User Database</h1>
  <v-text-field
    v-model="searchQuery"
    label="Search"
    required
  ></v-text-field>
  <v-table>
    <thead>
      <tr>
        <th class="text-left">ID</th>
        <th class="text-left">First Name</th>
        <th class="text-left">Last Name</th>
        <th class="text-left">Email</th>
        <th class="text-left">Role</th>
      </tr>
    </thead>
  <tbody>
    <tr v-row v-for="user in filteredData" :key="user.id" class="mb-2">
      <td class = "cursor-pointer" @click="openUpdateUser(user)">{{ user.id }}</td>
      <td class = "cursor-pointer" @click="openUpdateUser(user)">{{ user.firstName }}</td>
      <td class = "cursor-pointer" @click="openUpdateUser(user)">{{ user.lastName }}</td>
      <td class = "cursor-pointer" @click="openUpdateUser(user)">{{ user.email }}</td>
      <td class = "cursor-pointer" @click="openUpdateUser(user)">{{ user.role }}</td>
      <td>
        <v-icon color="red" class="cursor-pointer" @click="openUpdateUser(user)"> mdi-pencil </v-icon>
        |
        <v-icon color="red" class="cursor-pointer" @click="deleteUser(user.id)"> mdi-delete </v-icon>
      </td>
    </tr>
  </tbody>
  </v-table>     
  <v-dialog persistent v-model="isUpdateUser" width="800">
    <v-card class="rounded-lg elevation-5">
      <v-card-title class="headline mb-2">Update User</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="selectedUser.firstName"
          label="First Name"
          required
        ></v-text-field>

        <v-text-field
          v-model="selectedUser.lastName"
          label="Last Name"
          required
        ></v-text-field>

        <v-text-field
          v-model="selectedUser.email"
          label="Email"
          required
          disabled
        ></v-text-field>

        <v-text-field
          v-model="selectedUser.role"
          label="role"
          required
        ></v-text-field>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="flat"
          color="secondary"
          @click="closeUpdateUser()"
          >Close</v-btn
        >
        <v-btn variant="flat" color="primary" @click="updateUser(selectedUser.id, selectedUser)"
          >Update</v-btn
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