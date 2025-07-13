import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "LandingPage",
      component: () => import("./views/LandingPage.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("./views/Login.vue"),
    },
    {
      path: "/Recommendations",
      name: "Recommendations",
      component: () => import("./views/Recommendations.vue"),
    },
    {
      path: "/JoinSession",
      name: "JoinSession",
      component: () => import("./views/JoinSession.vue"),
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
      path: "/QuizDatabasePage/:classID",
      name: "QuizDatabasePage",
      component: () => import("./views/QuizDatabasePage.vue"),
    },
    {
      path: "/UserDatabasePage",
      name: "UserDatabasePage",
      component: () => import("./views/UserDatabasePage.vue"),
    },
  ],
});

export default router;
