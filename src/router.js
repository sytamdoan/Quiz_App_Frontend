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
      path: "/ClassDatabasePage",
      name: "ClassDatabasePage",
      component: () => import("./views/ClassDatabasePage.vue"),
    },
    {
      path: "/UserDatabasePage",
      name: "UserDatabasePage",
      component: () => import("./views/UserDatabasePage.vue"),
    },
  ],
});

export default router;
