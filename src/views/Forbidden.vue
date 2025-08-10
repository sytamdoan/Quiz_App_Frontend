<template>
  <div class="pa-8 text-center">
    <h1>403 — Permission denied</h1>
    <p>You don’t have access to this page.</p>
    <v-btn color="primary" @click="$router.push({ name: 'Account' })">Go to Account</v-btn>
  </div>
</template>