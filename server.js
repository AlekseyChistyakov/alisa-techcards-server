const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// Обработка GET-запроса (нужно для модерации)
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

// URL Google Apps Script
const GOOGLE_SCRIPT_API = "https://script.google.com/macros/s/AKfycbzEh_tNMGWzdc9T263bqJMzyho4JbZfe1iFX6Ta8loxVlc5gtH_iIEUrJIwMp8BbDJ7/exec";

app.post("/", async (req, res) => {
  const userCommand = req.body.request?.original_utterance?.trim().toLowerCase() || "";

  // Если нет запроса — верни сообщение "Навык подключён"
  if (!req.body.request || !req.body.request.original_utterance) {
    return res.json({
      response: {
        text: "Навык успешно подключён.",
        tts: "Навык успешно подключён.",
        end_session: false
      },
      version: "1.0"
    });
  }

  // Приветствие
  if (req.body.request.type === "LaunchRequest" || userCommand === "") {
    return res.json({
      response: {
        text: "Привет! Это навык Технологические карты. Скажите название блюда, например: 'Веревочка со свининой'.",
        tts: "Привет! Это навык Технологические карты. Скажите название блюда, например: Веревочка со свининой.",
        end_session: false
      },
      version: "1.0"
    });
  }

  // Помощь
  if (userCommand.includes("помощь")) {
    return res.json({
      response: {
        text: "Навык озвучивает рецепты. Просто скажите название блюда, например: 'Филадельфия классик'.",
        tts: "Скажите название блюда. Например: Филадельфия классик.",
        end_session: false
      },
      version: "1.0"
    });
  }

  // Что ты умеешь
  if (userCommand.includes("что ты умеешь")) {
    return res.json({
      response: {
        text: "Я умею находить рецепты и озвучивать технологические карты блюд. Просто скажите его название.",
        tts: "Я умею находить рецепты и озвучивать технологические карты блюд. Просто скажите его название.",
        end_session: false
      },
      version: "1.0"
    });
  }

  // Запрос к Google Script API
  try {
    const result = await axios.get(GOOGLE_SCRIPT_API, {
      params: { dish: userCommand }
    });

    // Если API вернул ошибку
    if (result.data.error) {
      return res.json({
        response: {
          text: result.data.error,
          tts: result.data.error,
          end_session: false
        },
        version: "1.0"
      });
    }

    const { блюдо, ингредиенты, рецепт } = result.data;
    const intro = `${блюдо}. В составе: ${ингредиенты.map(i => i["продукт"]).slice(0, 3).join(", ")}, и другие.`;

    return res.json({
      response: {
        text: `${блюдо}. ${рецепт}`,
        tts: `${intro} ${рецепт}`,
        end_session: false
      },
      version: "1.0"
    });

  } catch (error) {
    console.error("❌ Ошибка при запросе к Google Script:", error.message, error.response?.data);

    return res.json({
      response: {
        text: "Произошла ошибка при получении рецепта. Попробуйте позже.",
        tts: "Произошла ошибка при получении рецепта. Попробуйте позже.",
        end_session: false
      },
      version: "1.0"
    });
  }
});

// Render сам укажет порт
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("✅ Алиса-сервер на Render запущен на порту", port));
