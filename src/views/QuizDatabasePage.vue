
<script setup>
import { onMounted } from 'vue'
import { ref, computed } from "vue";
import QuizServices from "../services/QuizServices.js";
import QuestionServices from "../services/QuestionServices.js";
import AnswerServices from "../services/AnswerServices.js";
import LLMServices from "../services/LLMServices.js";
import QuizSessionServices from "../services/QuizSessionServices.js";
import { useRoute, useRouter } from "vue-router";

const Quiz = ref([])
const route = useRoute();
const router = useRouter();
const myClassID = ref('');
const selectedQuiz = ref({});
const isUpdateQuiz = ref(false);
const addQuizCheck = ref(false);
const searchQuery = ref('');
const snackbar = ref({
  value: false,
  color: "",
  text: "",
});

const filteredData = computed(() => {
  let data = Quiz.value;
  let keyword = searchQuery.value.toLowerCase();
  if (keyword) {
    data = data.filter((row) => {
      return (
        String(row.id).toLowerCase().includes(keyword) ||
        String(row.name).toLowerCase().includes(keyword) ||
        String(row.type).toLowerCase().includes(keyword) ||
        String(row.subject).toLowerCase().includes(keyword) ||
        String(row.timeLimit).toLowerCase().includes(keyword)
      );
    });
  }
  return data
})

onMounted(async () => {
  try {
    myClassID.value = route.params.classID;
    fetchQuiz()
  } catch (error) {
    console.error("Cannot Fetch Quizes: ", error)
  }
});

async function deleteQuiz(id) {
  await QuizServices.deleteQuiz(id)
    .then(() => {
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "Quiz Deleted";
      fetchQuiz()
    })
    .catch((error) => {
      console.error(error);
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = error.response.data.message;
    });
};

async function updateQuiz(id, Quiz) {
  await QuizServices.updateQuiz(id, Quiz)
    .then(() => {
      fetchQuiz()
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "Quiz Updated";
      isUpdateQuiz.value = false;
    })
    .catch((error) => {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = error.response.data.message;
    });
};

async function addQuiz(Quiz) {
  await QuizServices.addQuiz(myClassID.value, Quiz)
    .then(() => {
      fetchQuiz()
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "Quiz Added";
      isUpdateQuiz.value = false;
    })
    .catch((error) => {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = error.response.data.message;
    });
};

async function fetchQuiz() {
  const response = await QuizServices.getQuiz(myClassID.value)
  Quiz.value = response.data
}

function openUpdateQuiz(Quiz, addQuiz) {
  if(!Quiz.isEditable && !addQuiz)
    return;
  addQuizCheck.value = addQuiz;
    if(addQuizCheck.value) {
    selectedQuiz.value = {
      isEditable:true
    };
  } else {
    selectedQuiz.value = {...Quiz}
  }
  isUpdateQuiz.value = true;
}

async function duplicateQuiz(Quiz){
  try {
    const response = await QuizServices.duplicateQuiz(Quiz.id);
    console.log("Quiz duplicated", response.data);
    await fetchQuiz();
  } catch (err) {
    console.error("Error duplicating quiz", err);
  }
};

function closeUpdateQuiz() {
  isUpdateQuiz.value = false;
}

function closeSnackBar() {
  snackbar.value.value = false;
}

function goToQuestionPage(QuizID) {
  router.push({ name: "QuestionDatabasePage", params: {quizID: QuizID} });
}

function goToQuizSessionsPage(QuizID) {
  router.push({ name: "QuizSessionDatabasePage", params: {quizID: QuizID} });
}

async function startQuiz(Quiz) {
  let quizSession = {
    quizId:Quiz.id,
    isActive: true,
  };

  //Call the lockQuiz from the controller to ensure the quiz cannot be edited anymore after a session has been created from it
  await QuizServices.lockQuiz(Quiz.id);
  
  await QuizSessionServices.addQuizSession(quizSession)
    .then((response) => {
      fetchQuiz()
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text = "Quiz Session Started";
      router.push({ name: "ProfessorWaitingPage", params: {quizSessionID: response.data.id} });
    })
    .catch((error) => {
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = error.response.data.message;
    });
};

//Whole Quiz Generation Functoin
async function generateQuiz() {
  //isLoading.value = true;
  await LLMServices.getGeneratedQuizForClass(myClassID.value)
    .then((response) => {
      const jsonText = response.data.slice(response.data.indexOf("```json")).replace(/```json\n?/, '').replace(/\n?```$/, '');
      let results = JSON.parse(jsonText);
      let newQuiz = {
      classId: myClassID.value,
      name:results.name,
      type:'quiz',
      subject: results.subject,
      timeLimit:1,//Default to 1 minute
      isResultsVisible:false,
      isAnonymous:false,
      isEditable:true
      };
      QuizServices.addQuiz(newQuiz.classId, newQuiz)
      .then((quizResponse) => {
        results.questions.forEach(element => {
          //New Question Section
          let newQuestion = {
            quizId: quizResponse.data.id,
            questionText: element.questionText,
          }
          let questionAnswers = element.answers;
          QuestionServices.addQuestion(newQuestion.quizId,newQuestion)
          .then((questionResponse)=>{
            //New Answer Section
            questionAnswers.forEach(answerElement => {
                let newAnswer = {
                questionId: questionResponse.data.id,
                answerText: answerElement.answerText,
                isCorrect: answerElement.isCorrect,
              }
              AnswerServices.addAnswer(newAnswer.questionId,newAnswer)
              .catch((answerError)=>{
                console.log(answerError);
              });
            });
          })
          .catch((questionError)=>{
            console.log(questionError);
          });
        });
        snackbar.value.value = true;
        snackbar.value.color = "green";
        snackbar.value.text = "Generated Quiz Added";
      })
      .catch((error) => {
        console.log(error);
        snackbar.value.value = true;
        snackbar.value.color = "red";
        snackbar.value.text = "Error Adding Generated Quiz";
      });
    })
    .catch((error) => {
      console.log(error);
    })
    .finally(()=>{
      fetchQuiz();
    });
}
</script>

<template>
  <h1 class="title">Quiz Database</h1>
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
        <th class="text-left">Type</th>
        <th class="text-left">Subject</th>
        <th class="text-left">Time Limit (sec)</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="Quiz in filteredData" :key="Quiz.id" class="mb-2">
        <td class = "cursor-pointer" @click="openUpdateQuiz(Quiz, false)">{{ Quiz.id }}</td>
        <td class = "cursor-pointer" @click="openUpdateQuiz(Quiz, false)">{{ Quiz.name }}</td>
        <td class = "cursor-pointer" @click="openUpdateQuiz(Quiz, false)">{{ Quiz.type }}</td>
        <td class = "cursor-pointer" @click="openUpdateQuiz(Quiz, false)">{{ Quiz.subject }}</td>
        <td class = "cursor-pointer" @click="openUpdateQuiz(Quiz, false)">{{ Quiz.timeLimit }}</td>
        <td v-if="Quiz.isEditable">
          <v-icon color="red" class="cursor-pointer" @click="startQuiz(Quiz)"> mdi-timer </v-icon>
          |
          <a @click="goToQuestionPage(Quiz.id)" style="color: blue; cursor: pointer; text-decoration: underline;"> View Questions</a>
          |
          <a @click="goToQuizSessionsPage(Quiz.id)" style="color: blue; cursor: pointer; text-decoration: underline;"> View Sessions</a>
          |
          <v-icon color="red" class="cursor-pointer" @click="openUpdateQuiz(Quiz, false)"> mdi-pencil </v-icon>
          |
          <v-tooltip text="Duplicate Quiz" location="top">
            <template v-slot:activator="{ props }">
              <v-icon
                v-bind="props"
                color="red"
                class="cursor-pointer"
                @click="duplicateQuiz(Quiz)"
              >
                mdi-content-duplicate
              </v-icon>
            </template>
          </v-tooltip>
          |
          <v-icon color="red" class="cursor-pointer" @click="deleteQuiz(Quiz.id)"> mdi-delete </v-icon>
        </td>
        <td v-else>
          <v-icon color="red" class="cursor-pointer" @click="startQuiz(Quiz)"> mdi-timer </v-icon>
          |
          <a @click="goToQuestionPage(Quiz.id)" style="color: blue; cursor: pointer; text-decoration: underline;"> View Questions</a>
          |
          <a @click="goToQuizSessionsPage(Quiz.id)" style="color: blue; cursor: pointer; text-decoration: underline;"> View Sessions</a>
          |
          <v-tooltip text="Duplicate Quiz" location="top">
            <template v-slot:activator="{ props }">
              <v-icon
                v-bind="props"
                color="red"
                class="cursor-pointer"
                @click="duplicateQuiz(Quiz)"
              >
                mdi-content-duplicate
              </v-icon>
            </template>
          </v-tooltip>
          |
          Not Editable
        </td>
      </tr>
    </tbody>
  </v-table>
  <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn variant="flat" color="primary" @click="openUpdateQuiz(Quiz, true)">Add Quiz</v-btn>
    <v-btn variant="flat" color="primary" @click="generateQuiz()">Generate Quiz</v-btn>
  </v-card-actions>

  <v-dialog persistent v-model="isUpdateQuiz" width="800">
    <v-card class="rounded-lg elevation-5">
      <v-card-title class="headline mb-2">Update Quiz</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="selectedQuiz.name"
          label="Quiz Name"
          required
        ></v-text-field>

        <v-radio-group
          v-model="selectedQuiz.type"
          label="Quiz Type"
          required
        >
          <v-radio label = "Quiz" :value="'quiz'" />
          <v-radio label = "Poll" :value="'poll'" />
        </v-radio-group>

        <v-text-field
          v-model="selectedQuiz.subject"
          label="Quiz Subject"
          required
        ></v-text-field>

        <v-text-field
          v-model="selectedQuiz.timeLimit"
          label="Time Limit (sec)"
          type = "number"
          required
        ></v-text-field>

        <v-radio-group
          v-model="selectedQuiz.isResultsVisible"
          label="Are Results Visible?"
          required
        >
          <v-radio label = "Yes" :value="true" />
          <v-radio label = "No" :value="false" />
        </v-radio-group>

        <v-radio-group
          v-model="selectedQuiz.isAnonymous"
          label="Is This anonymous?"
          required
        >
          <v-radio label = "Yes" :value="true" />
          <v-radio label = "No" :value="false" />
        </v-radio-group>

        <v-radio-group
          v-model="selectedQuiz.isEditable"
          label="Is This Editable?"
          required
          disabled
        >
          <v-radio label = "Yes" :value="true" />
          <v-radio label = "No" :value="false" />
        </v-radio-group>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="flat"
          color="secondary"
          @click="closeUpdateQuiz()"
          >Close</v-btn
        >
        <v-btn v-if="!addQuizCheck" variant="flat" color="primary" @click="updateQuiz(selectedQuiz.id, selectedQuiz)"
          >Update Quiz</v-btn
        >
        <v-btn v-if="addQuizCheck" variant="flat" color="primary" @click="addQuiz(selectedQuiz)"
          >Add Quiz</v-btn
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