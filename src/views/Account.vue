<script setup>
import UserServices from "../services/UserServices.js";
import { ref, onMounted } from "vue";

const user = ref("");
const isUpdateAccount = ref(false);
const snackbar = ref({
  value: false,
  color: "",
  text: "",
});

onMounted(async () => {
  user.value = JSON.parse(window.localStorage.getItem("user"));
});

function openUpdateAccount() {
  isUpdateAccount.value = true;
}

function closeUpdateAccount() {
  isUpdateAccount.value = false;
}

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
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "User Updated";
      window.localStorage.setItem("user", JSON.stringify(user.value));
      isUpdateAccount.value = false;
    })
    .catch((error) => {
      console.error("Update User Error:", error);
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = "Couldn't Update User";
    });
};

function closeSnackBar() {
  snackbar.value.value = false;
}
</script>

<template>
  <v-container class="text-center py-10">
    <v-row justify="center">
      <v-col cols="12">
        <h2>{{user.firstName}} , {{user.lastName}}</h2>
        <p class="text-subtitle-1">{{user.email}}</p>
      </v-col>
    </v-row>

    <v-row justify="center" class="mt-10">
      <v-col cols="12" sm="4" class="d-flex justify-center">
        <v-btn class="mx-2" @click="openUpdateAccount()" color="grey" variant="flat" >Edit Info</v-btn>
        <v-btn class="mx-2" color="red" variant="flat">Reset Password</v-btn>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog persistent v-model="isUpdateAccount" width="800">
  <v-card class="rounded-lg elevation-5">
    <v-card-title class="headline mb-2">Edit User Account </v-card-title>
    <v-card-text>
      <v-text-field
        v-model="user.firstName"
        label="First Name"
        required
      ></v-text-field>

      <v-text-field
        v-model="user.lastName"
        label="Last Name"
        required
      ></v-text-field>

      <v-text-field
        v-model="user.email"
        label="Email"
        required
        disabled
      ></v-text-field>

    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        variant="flat"
        color="secondary"
        @click="closeUpdateAccount()"
        >Close</v-btn
      >
      <v-btn variant="flat" color="primary" @click="updateUser(user.id, user)"
        >Save Changes</v-btn
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

</style>