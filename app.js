const mysql = require("mysql2"); //подключаем БД
const express = require("express"); //подключаем фреймворк express
const expressHbs = require("express-handlebars");
const hbs = require("hbs");

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

// устанавливаем настройки для файлов layout
app.engine("hbs", expressHbs.engine( 
    //expressHbs.engine() осуществляет конфигурацию движка
{
layoutsDir: "views/layouts", 
//задает путь к папке с файлами layout относительно корня каталога проекта
defaultLayout: "layout", 
//указывает на название файла шаблона
 extname: "hbs" //задает расширение файлов
}
))

//устанавливаем Handlebars в качестве движка представлений в Express
app.set("view engine", "hbs");

// УСТАНОВКА МАРШРУТОВ
// ===================================================
// 

// маршурут на главную страницу
app.get("/", function(req, res){
    res.render("index.hbs", {title: "travel"});
});
// возвращаем форму для добавления данных
app.get("/create", function(req, res){
    res.render("create.hbs", {title: "Регистрация"});
});
// возвращаем браузеру форму для авторизации данных
app.get("/avtoriz", function (req, res) {
    res.render("avtoriz.hbs", {title: "Авторизация"});
});

// возвращаем форму с турами
app.get("/tours", function(req, res){
    res.render("tours.hbs", {title: "Наши туры"});
    });

// возвращаем форму о нас
app.get("/contacts", function(req, res){
    res.render("contacts.hbs", {title: "О нас"});
    });
 
// возвращаем форму с отзывами
app.get("/remarks-all", function(req, res){
   res.render("remarks-all.hbs", {title: "Отзывы"});
});    

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

app.listen(3000, function () {
    console.log("Сервер ожидает подключения...");
});