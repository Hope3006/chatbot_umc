const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const readline = require("readline");

const app = express();
app.set('view engine','ejs');
app.use(express.static(__dirname + '/public'));

const port = process.env.PORT || 3000;

// Reemplaza con tu clave API real
const API_KEY = "AIzaSyBxmEIk37R9eonsTuMND224qTCJRnzj3zE"; // 🚨 Esta es una clave de ejemplo, no uses esta.
const genAI = new GoogleGenerativeAI(API_KEY);

// Crea un array para almacenar el historial de conversación
let history = []; 

function createModelMessage(text) {
  return {
    role: "model",
    parts: [{ text }],
  };
}

async function getGeminiResponse(userInput) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    history.push(
      {
        role: "user",
        parts: [{ text: userInput }],
      },
      createModelMessage("")
    );

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 100,
      },
    });

    const result = await chat.sendMessage(userInput);
    const response = await result.response;
    const text = response.text();

    if (text) {
      history[history.length - 1] = createModelMessage(text);
      return text;
    } else {
      history[history.length - 1] = createModelMessage("Hazme otra pregunta");
      return "No se encontró respuesta. Por favor, intenta con otra pregunta.";
    }
  } catch (error) {
    console.error("Error during conversation:", error);
    if (error.response && (error.response.status === 503 || error.response.status === 429)) {
      return "El servicio no está disponible temporalmente por una sobrecarga del servidor. Por favor, inténtalo en unos minutos.";
    } else {
      history[history.length - 1] = createModelMessage("Hazme una pregunta normal");
      return "Ocurrió un error o su entrada es sensible. Por favor, intenta con otra.";
    }
  }
}

// Middleware para parsear JSON en el body
app.use(express.json());

app.post('/api/gemini', async (req, res) => {
  const userInput = req.body.text;
  
  // Obtiene la respuesta de Gemini Pro
  const responseText = await getGeminiResponse(userInput);

  res.json({ response: responseText });
});

app.get("/", async (req, res) => {

  res.render("index", { page: "Inicio" });  
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});