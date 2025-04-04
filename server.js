const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// ✅ Обработка GET-запроса на корень — нужно для проверки Яндексом
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

// 🔗 Твой Google Apps Script API
const GOOGLE_SCRIPT_API = "https://script.google.com/macros/s/AKfycbzEh_tNMGWzdc9T263bqJMzyho4JbZfe1iFX6Ta8loxVlc5gtH_iIEUrJIwMp8BbDJ7/exec";

app.post("/", async (req, res) => {
  const userCommand = req.body.request?.original_utterance?.trim().toLowerCase() || "";

  // Проверка подключения
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
        text: "Привет! Это навык Тех карты. Скажите название блюда, например: 'Канашими'.",
        tts: "Привет! Это навык Тех карты. Скажите название блюда, например: Канашими.",
        end_session: false
      },
      version: "1.0"
    });
  }

  // Помощь
  if (userCommand.includes("помощь")) {
    return res.json({
      response: {
        text: "Скажите название блюда, и я озвучу технологическую карту. Например: 'Филадельфия классик'.",
        tts: "Скажите название блюда, и я озвучу технологическую карту. Например: Филадельфия классик.",
        end_session: false
      },
      version: "1.0"
    });
  }

  // Что ты умеешь
  if (userCommand.includes("что ты умеешь")) {
    return res.json({
      response: {
        text: "Я умею находить рецепты и техкарты по названию блюда. Просто скажите его!",
        tts: "Я умею находить рецепты и техкарты по названию блюда. Просто скажите его!",
        end_session: false
      },
      version: "1.0"
    });
  }

  // Поиск блюда по API
  try {
    const result = await axios.get(GOOGLE_SCRIPT_API, {
      params: { dish: userCommand }
    });

    console.log("Ответ Google Script:", result.data); // 🐞 Логируем ответ

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
    console.error("Ошибка при запросе к Google Script:", error); // 🐞 Логируем ошибку
    return res.json({
      response: {
        text: "Не удалось получить рецепт. Попробуйте позже.",
        tts: "Не удалось получить рецепт. Попробуйте позже.",
        end_session: false
      },
      version: "1.0"
    });
  }
});

// 🚀 Запуск
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("✅ Алиса-сервер запущен на порту", port));
