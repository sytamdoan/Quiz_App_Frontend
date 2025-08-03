<script setup>
import { onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client';
import { ref, computed } from "vue";
import QuizServices from '../services/QuizServices.js';
import QuizSessionServices from "../services/QuizSessionServices.js";
import QuestionServices from "../services/QuestionServices.js";
import AnswerServices from "../services/AnswerServices.js";
import ResponseServices from "../services/ResponseServices.js"
import { useRoute, useRouter } from "vue-router";
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS} from 'chart.js'
import{Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale} from 'chart.js'
ChartJS.register(Title, Tooltip, BarElement, CategoryScale, LinearScale)

const socket = io('http://localhost:3001');
const route = useRoute();
const router = useRouter();
const quizSessionID = ref('');
const quizID = ref('');
const questionSet = ref({})
const answerSet = ref({})
const QuestionsXAxis = ref([])
const responseTallies = ref([])
const chartTitle = ref("")
const currentQuestion = ref(0)
const hasNextQuestion = computed(() => {
  return currentQuestion.value < (questionSet.value.length - 1);
});
const isSaveResponse = ref(true);
const responseBuffer = ref([]);
const missedResponses = ref([]);

const quiz = ref({ timeLimit: 20 });
const timeLeft = ref('00:00');
const remainingSeconds = ref(0);
let intervalId = null;

const updateTimeDisplay = () => {
  const minutes = Math.floor(remainingSeconds.value / 60);
  const seconds = remainingSeconds.value % 60;
  timeLeft.value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const startCountdown = () => {
  updateTimeDisplay();
  intervalId = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
      updateTimeDisplay();
    } else {
      clearInterval(intervalId);
    }
  }, 1000); //this forces the setInterval to run every 1000 ms
};

const resetCountdown = () => {
  clearInterval(intervalId);
  remainingSeconds.value = quiz.value.timeLimit;
  startCountdown();
};

const DataQuestions = computed(() => ({
  labels: QuestionsXAxis.value,
  datasets: [
    {
      data: responseTallies.value,
      backgroundColor: 'red'
    }
  ]
}));

const chartSettings = computed(() => ({
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: chartTitle.value,
      font: {
        size: 18
      },
    }
  }
}))


onMounted(async () => {
  try {
    quizSessionID.value = route.params.quizSessionID;
    await grabQuizSession();

    // Wait until quizID.value is set
    while (!quizID.value) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // wait 50ms
    }
    console.log("Resolved quizID:", quizID.value);

    //this is needed to grab the timeLimit from the quiz that we are running a session on
    const quizData = await QuizServices.getQuizById(quizID.value);
    quiz.value = quizData.data;
    remainingSeconds.value = parseInt(quiz.value.timeLimit);
    console.log("Quiz data response:", quizData);
console.log("quiz.value.timeLimit:", quizData.data?.timeLimit);
    startCountdown();
    console.log("Starting countdown with seconds:", remainingSeconds.value);

  } catch (error) {
    console.error("Cannot Fetch QuizSessionId: ", error)
  }
  try {
    socket.on("connect", () => {
      console.log("Connnected To Backend From Professor");
    })
    socket.on(quizSessionID.value + "response", (data) => {
      tallyResponse(data.answer);
      const sRes = {};
      sRes.userId = data.userId;
      sRes.answerId = data.answer.id;
      responseBuffer.value.push(sRes);
    })

    socket.emit("nextQuestion", {
      quizSessionID: quizSessionID.value
    });
    await grabQuestions();
    sendQuestionsAndAnswers();

  } catch (error) {
    console.error("Something Wrong Happened")
  }
});

onUnmounted(() => {
  clearInterval(intervalId);
});

async function grabQuestions() {
  await QuestionServices.getQuestion(quizID.value)
    .then((res) => {
      questionSet.value = res.data.map(newQuestion => ({
        id: newQuestion.id,
        questionText: newQuestion.questionText,
        quizId: newQuestion.quizId
      }));
    })
    .catch((error) => {
      console.error("Something Wrong Happened")
    });
};

async function grabQuizSession() {
  await QuizSessionServices.getQuizSession(quizSessionID.value)
    .then((res) => {
      quizID.value = res.data.quizId;
      
    })
    .catch((error) => {
      console.log(error);
      console.error("Something Wrong Happened")
    });
};

async function grabAnswers(questionID) {
  await AnswerServices.getAnswer(questionID)
    .then((res) => {
      answerSet.value = res.data.map(newAnswer => ({
        id: newAnswer.id,
        answerText: newAnswer.answerText,
//        isCorrect: newAnswer.isCorrect
      }));
    })
    .catch((error) => {
      console.error("Something Wrong Happened")
    });
};

async function sendQuestion() {
  socket.emit("question", {
    quizSessionID: quizSessionID.value,
    id: questionSet.value[currentQuestion.value].id,
    question: questionSet.value[currentQuestion.value].questionText,
    quizID: questionSet.value[currentQuestion.value].quizId
  });
};

async function sendAnswers() {
  socket.emit("answers", {
    quizSessionID: quizSessionID.value,
    quizID: quizID.value,
    answerSet: answerSet.value
  });
}

async function resetAndRepopulateBarGraph() {
  chartTitle.value = questionSet.value[currentQuestion.value].questionText;
  QuestionsXAxis.value = [];
  responseTallies.value = [];
  for (const key in answerSet.value) {
    const answers = answerSet.value[key].answerText;
    QuestionsXAxis.value.push(answers);
    responseTallies.value.push(0);
  }
}

async function sendQuestionsAndAnswers() {
  await grabAnswers(questionSet.value[currentQuestion.value].id);
  sendQuestion();
  sendAnswers();
  resetAndRepopulateBarGraph();
}

async function loadNextQuestion() {
  if (isSaveResponse.value){
    await saveResponses();
  }
  isSaveResponse.value=true; // reset the checkbox

  currentQuestion.value += 1;
  socket.emit("nextQuestion", {
    quizSessionID: quizSessionID.value
  });
  sendQuestionsAndAnswers();
  resetCountdown(); //adding reset to start the question timer over
}


async function tallyResponse(response) {
  const indexOfResponse = QuestionsXAxis.value.indexOf(response.answerText)
  if(indexOfResponse !== -1) {
    responseTallies.value[indexOfResponse] += 1;
    responseTallies.value = [...responseTallies.value]
  }
}
async function saveResponses(){
  const buffer = responseBuffer.value
  responseBuffer.value = [];

  await Promise.all(
    buffer.map(async (sRes) => {
      sRes.quizSessionId = quizSessionID.value;
      sRes.questionId = questionSet.value[currentQuestion.value].id;
      console.log(sRes);

      return ResponseServices.addItem(sRes)
        .catch((err) => {
          console.log("Could not add a response.")
          missedResponses.value.push(sRes);
        })
    }))

  console.log(missedResponses.value);
  console.log(responseBuffer.value)
}

async function endQuiz() {
  if (isSaveResponse.value){
    await saveResponses();
  }
  console.log("Here are missed responses.");
  console.log(missedResponses);

  await QuizSessionServices.endQuizSession(quizSessionID.value)
    .then((res) => {
      console.log("Quiz has ended")
      socket.emit("end", {
        quizSessionID: quizSessionID.value
      });
      router.push({ name: "ProfessorEndQuizPage"});
    })
    .catch((error) => {
      console.log(error);
      console.error("Something Wrong Happened")
    });
}

</script>

<template>
  <div class="timer" style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">
    Time Left: {{ timeLeft }}
  </div>
  <div style="width: 700px; height: 500px;">
    <Bar :data="DataQuestions" :chart-options="chartSettings" />
      <v-card-actions>
    <v-btn v-if="hasNextQuestion" variant="flat" color="primary" @click="loadNextQuestion()">Next Question</v-btn>
    <v-btn variant="flat" color="primary" @click="endQuiz()">Finish Quiz</v-btn>
    </v-card-actions>
    <v-card-actions>
      <input type="checkbox" id="saveResponses" v-model="isSaveResponse"/>
      <label for="saveResponses">Save Responses upon Next Question</label>
    </v-card-actions>
  </div>
</template>

<style scoped>
.timer {
  color: #d32f2f;
}
</style>