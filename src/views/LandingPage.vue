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


function closeSnackBar() {
  snackbar.value.value = false;
}
</script>

<template>
  <v-container class="text-center py-10">
    <v-row justify="center">
      <v-col cols="12">
        <h2>Welcome to QuizApp!</h2>
      </v-col>
    </v-row>

    <v-row justify="center" class="mt-10">
      <v-col cols="12" sm="4" class="d-flex justify-center">
        <v-btn class="mx-2" :to="{ name: 'JoinSession' }" color="grey" variant="flat" >Join Session</v-btn>
        <v-btn class="mx-2" :to="{ name: 'login' }" color="red" variant="flat">Login</v-btn>
      </v-col>
    </v-row>
  </v-container>
  
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