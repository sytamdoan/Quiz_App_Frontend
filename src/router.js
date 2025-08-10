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
      path: "/Recommendations/:classID",
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
      path: "/QuestionDatabasePage/:quizID",
      name: "QuestionDatabasePage",
      component: () => import("./views/QuestionDatabasePage.vue"),
    },
    {
      path: "/QuizSessionDatabasePage/:quizID",
      name: "QuizSessionDatabasePage",
      component: () => import("./views/QuizSessionDatabasePage.vue"),
    },
    {
      path: "/ResponseDatabasePage/:quizSessionID",
      name: "ResponseDatabasePage",
      component: () => import("./views/ResponseDatabasePage.vue"),
    },
    {
      path: "/AnswerDatabasePage/:questionID",
      name: "AnswerDatabasePage",
      component: () => import("./views/AnswerDatabasePage.vue"),
    },
    {
      path: "/UserDatabasePage",
      name: "UserDatabasePage",
      component: () => import("./views/UserDatabasePage.vue"),
      meta: { requiresAdmin: true },
    },
    {
      path: "/StudentQuestion/:quizSessionID",
      name: "StudentQuestion",
      component: () => import("./views/StudentQuestion.vue"),
    },
    {
      path: "/ProfessorQuestion/:quizSessionID",
      name: "ProfessorQuestion",
      component: () => import("./views/ProfessorQuestion.vue"),
    },
    {
      path: "/ProfessorWaitingPage/:quizSessionID",
      name: "ProfessorWaitingPage",
      component: () => import("./views/ProfessorWaitingPage.vue"),
    },
    {
      path: "/ProfessorEndQuizPage/",
      name: "ProfessorEndQuizPage",
      component: () => import("./views/ProfessorEndQuizPage.vue"),
    },
    {
      path: "/StudentEndQuizPage/",
      name: "StudentEndQuizPage",
      component: () => import("./views/StudentEndQuizPage.vue"),
    },
    {
      path: "/forbidden",
      name: "Forbidden",
      component: () => import("./views/Forbidden.vue"),
    },
  ],
});

// Global guard for admin-only pages
router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (to.meta.requiresAdmin) {
    if (!user || Number(user.role) !== 2) {
      return next({ name: "Forbidden" });
    }
  }
  next();
});

export default router;