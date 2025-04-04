const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// Обработка GET-запроса (нужна для модерации)
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

// URL Google Apps Script для получения рецептов
const GOOGLE_SCRIPT_API = "https://script.google.com/macros/s/AKfycbzEh_tNMGWzdc9T263bqJMzyho4JbZfe1iFX6Ta8loxVlc5gtH_iIEUrJIwMp8BbDJ7/exec";

app.post("/", async (req, res) => {
  const userCommand = req.body.request?.original_utterance?.trim().toLowerCase() || "";

  // Проверка: Алиса просто делает тестовый запрос
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
        text: "Привет! Это навык Тех карты. Скажите название блюда, например: 'Канашими'.",
        tts: "Привет! Это навык Тех карты. Скажите название блюда, например: Канашими.",
        end_session: false
      },
      version: "1.0"
    });
  }

  // Команда «помощь»
  if (userCommand.includes("помощь")) {
    return res.json({
      response: {
        text: "Вы можете получить рецепт любого блюда. Просто скажите его название, например: 'Филадельфия классик'.",
        tts: "Скажите название блюда, и я озвучу рецепт. Например: Филадельфия классик.",
        end_session: false
      },
      version: "1.0"
    });
  }

  // Команда «что ты умеешь»
  if (userCommand.includes("что ты умеешь")) {
    return res.json({
      response: {
        text: "Я озвучиваю рецепты и техкарты блюд. Скажите название блюда — например: Канашими.",
        tts: "Я озвучиваю рецепты. Скажите название блюда — например, Канашими.",
        end_session: false
      },
      version: "1.0"
    });
  }

  // Запрос блюда через Google Sheets API
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
    const firstLine = `${блюдо}. В состав входят: ${ингредиенты.map(i => i["продукт"]).slice(0, 3).join(", ")}, и другие.`;

    return res.json({
      response: {
        text: `${блюдо}. ${рецепт}`,
        tts: `${firstLine} ${рецепт}`,
        end_session: false
      },
      version: "1.0"
    });
  } catch (e) {
    return res.json({
      response: {
        text: "Ошибка получения рецепта. Попробуйте позже.",
        tts: "Ошибка получения рецепта. Попробуйте позже.",
        end_session: false
      },
      version: "1.0"
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Алиса-сервер на Render запущен ✅"));
