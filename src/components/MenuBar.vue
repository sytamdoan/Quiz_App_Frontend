<script setup>
import ocLogo from "/oc_logo.png";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import UserServices from "../services/UserServices";

const router = useRouter();
const user = ref(null);
const logoURL = ref("");

onMounted(() => {
  logoURL.value = ocLogo;
  user.value = JSON.parse(localStorage.getItem("user"));
});

function logout() {
  UserServices.logoutUser()
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.log(error);
    });
  localStorage.removeItem("user");
  user.value = null;
  router.push({ name: "login" });
}
</script>

<script>
export default {
  name: 'MenuControl',
  data() {
    return {
      menuVisible: false
    };
  }
};
</script>

<template>
  <div>
    <v-app-bar color="primary" app dark>
      <!-- <v-btn class="mx-2" :to="{ name: 'Recommendations' }"> Get Recommendations </v-btn> -->
      <v-btn class="mx-2" :to="{ name: 'JoinSession' }"> Join Session </v-btn>
      <v-spacer></v-spacer>

      <v-menu v-model="menuVisible" offset-y>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item :to="{ name: 'Account' }" link>
            <v-list-item-title>Account</v-list-item-title>
          </v-list-item>
          <v-list-item :to="{ name: 'ClassDatabasePage' }" link>
            <v-list-item-title>Class Database</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="user && user.role === 2" :to="{ name: 'UserDatabasePage' }" link>
            <v-list-item-title>User Database</v-list-item-title>
          </v-list-item>
          <v-list-item :to="{ name: 'login' }" link>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

    </v-app-bar>
  </div>
</template>
