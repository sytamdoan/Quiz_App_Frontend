import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "login",
      component: () => import("./views/Login.vue"),
    },
    {
      path: "/Recommendations",
      name: "Recommendations",
      component: () => import("./views/Recommendations.vue"),
    },
    {
      path: "/Account",
      name: "Account",
      component: () => import("./views/Account.vue"),
    },
    {
      path: "/AuthorDatabasePage",
      name: "AuthorDatabasePage",
      component: () => import("./views/AuthorDatabasePage.vue"),
    },
  ],
});

export default router;
