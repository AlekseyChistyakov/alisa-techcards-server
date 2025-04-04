const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// GET-запрос — проверка подключения
app.get("/", (req, res) => {
  res.json({
    response: {
      text: "Навык успешно подключён.",
      tts: "Навык успешно подключён.",
      end_session: false
    },
    version: "1.0"
  });
});

// Ссылка на Google Apps Script
const GOOGLE_SCRIPT_API = "https://script.google.com/macros/s/AKfycbzEh_tNMGWzdc9T263bqJMzyho4JbZfe1iFX6Ta8loxVlc5gtH_iIEUrJIwMp8BbDJ7/exec";

app.post("/", async (req, res) => {
  try {
    const userCommand = req.body?.request?.original_utterance?.trim().toLowerCase();

    // Если пустой запрос или проверка запуска
    if (!userCommand || req.body.request.type === "LaunchRequest") {
      return res.json({
        response: {
          text: "Это навык Технологические карты. Скажите название блюда — например, Веревочка со свининой.",
          tts: "Это навык Технологические карты. Скажите название блюда — например, Веревочка со свининой.",
          end_session: false
        },
        version: "1.0"
      });
    }

    // Команды "помощь" и "что ты умеешь"
    if (userCommand.includes("помощь")) {
      return res.json({
        response: {
          text: "Просто скажите название блюда — например: Филадельфия классик или Канашими.",
          tts: "Скажите название блюда, и я расскажу, как его приготовить.",
          end_session: false
        },
        version: "1.0"
      });
    }

    if (userCommand.includes("что ты умеешь")) {
      return res.json({
        response: {
          text: "Я умею озвучивать рецепты по названию блюда. Просто скажите: рецепт и название.",
          tts: "Я озвучу рецепт. Просто скажите название блюда.",
          end_session: false
        },
        version: "1.0"
      });
    }

    // Запрос к Google Script API
    const apiResponse = await axios.get(GOOGLE_SCRIPT_API, {
      params: { dish: userCommand }
    });

    const data = apiResponse.data;

    // Обработка ошибок
    if (data.error) {
      return res.json({
        response: {
          text: data.error,
          tts: data.error,
          end_session: false
        },
        version: "1.0"
      });
    }

    // Собираем ответ
    const { блюдо, ингредиенты, рецепт } = data;
    const shortList = ингредиенты.map(i => i["продукт"]).slice(0, 3).join(", ");
    const ttsIntro = `${блюдо}. В состав входят: ${shortList}, и другие.`;
    const resultText = `${блюдо}. ${рецепт}`;

    return res.json({
      response: {
        text: resultText,
        tts: `${ttsIntro} ${рецепт}`,
        end_session: false
      },
      version: "1.0"
    });

  } catch (error) {
    console.error("Ошибка в обработке:", error.message);
    return res.json({
      response: {
        text: "Произошла ошибка при получении рецепта. Попробуйте ещё раз.",
        tts: "Произошла ошибка при получении рецепта. Попробуйте ещё раз.",
        end_session: false
      },
      version: "1.0"
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("✅ Алиса-сервер запущен на порту", port);
});
