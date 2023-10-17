const mysql = require("mysql2"); //подключаем БД
const express = require("express"); //подключаем фреймворк express
const app = express(); //создаем объект приложение

const urlencodedParser = express.urlencoded({ extended: false });
//парсер URL – разбирает URL

// сообщаем Node где лежат ресурсы сайта
app.use(express.static(__dirname + '/public'));

//создаем пул подключений к нашему серверу
const pool = mysql.createPool({
    connectionLimit: 5,
    host: "localhost",      //наш хостинг
    user: "root",           //логин к нашей базе
    database: "travel",     //наша база travel, созданная в прошлой работе
    password: ""            //пароль к нашей базе
});
//устанавливаем Handlebars в качестве движка представлений в Express
app.set("view engine", "hbs");

//получаем отправленные данные со страницы «Регистрация» create.hbs и добавляем их в БД
app.post("/create", urlencodedParser, function (req, res) {
    if (!req.body) return res.sendStatus(400);
    const Name = req.body.name;
    const Login = req.body.login;
    const Pass = req.body.pass;
    pool.query("INSERT INTO users (Name, Login, Pass) VALUES (?,?,?)", [Name, Login, Pass], function (err, data) {
            if (err) return console.log(err);
            //пока просто перенаправляем на index.hbs
            res.redirect("/");
            //выводим в консоль в случае успеха
            console.log("Добавил в базу");
        });
});
// возвращаем браузеру форму для авторизации данных
app.get("/avtoriz", function (req, res) {
    res.render("avtoriz.hbs");
});
app.listen(3000, function () {
    console.log("Сервер ожидает подключения...");
});