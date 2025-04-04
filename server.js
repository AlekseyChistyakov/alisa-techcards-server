const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// Обработка GET-запроса — нужно для модерации Алисы
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

// 🔗 URL скрипта Google Apps Script
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

  // Приветствие при запуске навыка
  if (req.body.request.type === "LaunchRequest" || userCommand === "") {
    return res.json({
      response: {
        text: "Это навык Тех карты. Скажите название блюда — например, 'Веревочка со свининой'.",
        tts: "Это навык Тех карты. Скажите название блюда — например, Веревочка со свининой.",
        end_session: false
      },
      version: "1.0"
    });
  }

  // Команда «помощь»
  if (userCommand.includes("помощь")) {
    return res.json({
      response: {
        text: "Скажите название блюда, и я озвучу техкарту. Например: 'Канашими' или 'Филадельфия классик'.",
        tts: "Скажите название блюда, и я озвучу техкарту. Например: Канашими или Филадельфия классик.",
        end_session: false
      },
      version: "1.0"
    });
  }

  // Команда «что ты умеешь»
  if (userCommand.includes("что ты умеешь")) {
    return res.json({
      response: {
        text: "Я озвучиваю технологические карты по названию блюда. Просто скажите его.",
        tts: "Я озвучиваю технологические карты по названию блюда. Просто скажите его.",
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

    const состав = ингредиенты.map(i => i["продукт"]).slice(0, 3).join(", ") + ", и другие";
    const шаги = рецепт.split(". ").slice(0, 2).join(". ") + ".";

    const tts = `${блюдо}. В составе: ${состав}. ${шаги}`;
    const text = `${блюдо}. ${шаги}`;

    return res.json({
      response: {
        text,
        tts,
        end_session: false
      },
      version: "1.0"
    });

  } catch (error) {
    return res.json({
      response: {
        text: "Ошибка получения рецепта. Проверьте подключение.",
        tts: "Ошибка получения рецепта. Проверьте подключение.",
        end_session: false
      },
      version: "1.0"
    });
  }
});

// Запуск на порту Render
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Алиса-сервер запущен на порту ${port}`));
