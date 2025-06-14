# Обзор проекта

Проект представляет собой веб-приложение для конвертации файлов Jupyter Notebook (`.ipynb`) в форматы LaTeX и PDF. Пользователи могут загружать до 10 .ipynb-файлов, выбирать ячейки для включения в итоговый документ, указывать параметры форматирования и скачивать результаты конвертации. Клиентская часть приложения разработана на языке JavaScript с использованием фреймворка React, а серверная часть – на языке Python с использованием FastApi.

### Запуск приложения с помощью Docker

**Для тестовой среды**

   ```bash
   ENV_FILE=.env.development docker-compose up --build
   ```

**Для продовой среды**

   ```bash
   ENV_FILE=.env.production docker-compose up --build
   ```

### Запуск приложения без Docker

**Для запуска бэкенда** сначала необходимо создать и активировать окружение Python:

   ```bash
   python -m venv env
   source env/bin/activate
   ```
Затем запустить сервер Uvicorn:

   ```bash
   uvicorn app.main:app --reload
   ```

Для запуска фронтенда необходимо выполнить команды:

   ```bash
   npm install
   npm start
   ```

### Использование

На данный момент приложение доступно по адресу [http://ipynb-converter.ru](http://ipynb-converter.ru)
