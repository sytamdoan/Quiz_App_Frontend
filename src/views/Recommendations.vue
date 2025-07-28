<script setup>
import { onMounted } from 'vue'
import { ref, computed} from "vue";
import QuizServices from "../services/QuizServices.js";
import QuestionServices from "../services/QuestionServices.js";
import AnswerServices from "../services/AnswerServices.js";
import LLMServices from "../services/LLMServices.js";
import { useRoute, useRouter } from "vue-router";
const route = useRoute();
const router = useRouter();
const generatedQuiz = ref([]);
const generatedQuestions = ref([])
const classID = ref('')
const userData = JSON.parse(localStorage.getItem("user"));
const newQuiz = ref({});
const token = userData.token || "";
const isLoading = ref(false);
const loaded = ref(false);
const snackbar = ref({
  value: false,
  color: "",
  text: "",
});

onMounted(async () => {
  try {
    classID.value = route.params.classID;
    //Defaulting new class so that they can work with some data
    newQuiz.value = {
      classId: classID.value,
      name:'',
      type:'quiz',
      subject:'',
      timeLimit:1,//Default to 1 minute
      isResultsVisible:false,
      isAnonymous:false,
      isEditable:false
    }
    loaded.value = false;
    generateQuiz.value = {};
  } catch (error) {
    console.error(error)
  }
});
//whatever
function generateQuiz() {
  isLoading.value = true;
  LLMServices.getRecommendations(newQuiz.value)
    .then((response) => {
      const jsonText = response.data.slice(response.data.indexOf("```json")).replace(/```json\n?/, '').replace(/\n?```$/, '');
      generatedQuiz.value = JSON.parse(jsonText);
      generatedQuestions.value = JSON.parse(jsonText);
    })
    .catch((error) => {
      console.log(error);
    })
    .finally(()=>{
      loaded.value = true;
      isLoading.value = false;
    });
}

function resetForm() {
  newQuiz.value = newQuiz.value = {
      classId: classID.value,
      name:'',
      type:'quiz',
      subject:'',
      timeLimit:1,//Default to 1 minute
      isResultsVisible:false,
      isAnonymous:false,
      isEditable:false
    }
  loaded.value = false;
  generatedQuiz.value = {};
}

function addGeneratedData(){
  //New Quiz Section
  QuizServices.addQuiz(newQuiz.value.classId, newQuiz.value)
    .then((quizResponse) => {
      generatedQuestions.value.questions.forEach(element => {
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
      //isUpdateQuiz.value = false;
    })
    .catch((error) => {
      console.log(error);
      snackbar.value.value = true;
      snackbar.value.color = "red";
      snackbar.value.text = "Error Adding Generated Quiz";
    })
    .finally(()=>{
      goToQuizPage();
    });
}

function goToQuizPage() {
  router.push({ name: "QuizDatabasePage", params: {classID: classID.value} });
}

function closeSnackBar() {
  snackbar.value.value = false;
}
</script>

<template>
  <h1 class="title">Quiz Generation Page</h1>
<v-form>
  <v-text-field
    v-model="newQuiz.name"
    label="Quiz Name"
    :disabled="isLoading"
    required
  ></v-text-field>

  <v-radio-group
    v-model="newQuiz.type"
    label="Quiz Type"
    :disabled="isLoading"
    required
  >
    <v-radio label = "Quiz" :value="'quiz'" />
    <v-radio label = "Poll" :value="'poll'" />
  </v-radio-group>

  <v-text-field
    v-model="newQuiz.subject"
    label="Quiz Subject"
    :disabled="isLoading"
    required
  ></v-text-field>
  
  <v-btn     
    :disabled="isLoading"
    variant="flat"
    color="primary" 
    @click="resetForm()"
    >Reset Form</v-btn
  >

  <v-btn v-if="newQuiz.subject != '' && newQuiz.name != '' && !isLoading"
    :disabled="isLoading.value"
    variant="flat" 
    color="primary" 
    @click="generateQuiz()"
    >Generate Quiz</v-btn
    >
    <div v-if="isLoading">
      <v-progress-circular
        :size="50"
        color="primary"
        indeterminate
      ></v-progress-circular>
      Generating Quiz. Please Wait...
    </div>
</v-form>
  <!-- <v-table>
  <thead>
    <tr>
      <th class="text-left">Title</th>
      <th class="text-left">Author</th>
      <th class="text-left">Publisher</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="recommendedBook in recommendedBooks" :key="recommendedBook.book" class="mb-2">
      <td class = "cursor-pointer" >{{recommendedBook.book}}</td>
      <td class = "cursor-pointer" >{{recommendedBook.author }}</td>
      <td class = "cursor-pointer" >{{recommendedBook.publisher }}</td>
      <v-icon color="red" class="cursor-pointer"> mdi-plus </v-icon>
      |
      <v-icon color="red" class="cursor-pointer"> mdi-star </v-icon>
    </tr>
  </tbody>
  </v-table> -->
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

  <v-dialog persistent v-model="loaded">
    <v-card class="rounded-lg elevation-5">
      <v-card-title class="headline mb-2">
        Generated Quiz
      </v-card-title>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th class="text-left">Question</th>
              <th class="text-left">Answer 1</th>
              <th class="text-left">Answer 2</th>
              <th class="text-left">Answer 3</th>
              <th class="text-left">Answer 4</th>

            </tr>
          </thead>
          <tbody>
            <tr v-for="Item in generatedQuiz.questions" :key="Item.questionText" class="mb-2">
              <td class = "text-left" >{{ Item.questionText }}</td>
              <td class = "text-left" >{{ Item.answers[0].answerText }}|{{ Item.answers[0].isCorrect?"Correct Answer":"Incorrect Answer" }} </td>
              <td class = "text-left" >{{ Item.answers[1].answerText }}|{{ Item.answers[1].isCorrect?"Correct Answer":"Incorrect Answer" }} </td>
              <td class = "text-left" >{{ Item.answers[2].answerText }}|{{ Item.answers[2].isCorrect?"Correct Answer":"Incorrect Answer" }} </td>
              <td class = "text-left" >{{ Item.answers[3].answerText }}|{{ Item.answers[3].isCorrect?"Correct Answer":"Incorrect Answer" }} </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="primary" @click="addGeneratedData()"
          >Add Quiz</v-btn
        >
        <v-btn variant="flat" color="primary" @click="resetForm()"
          >Clear and Restart</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.title {
  text-align: center;
  margin: 0.5rem 0;
  font-weight: 600;
}
v-dialog{
 width:80%;
}
</style>