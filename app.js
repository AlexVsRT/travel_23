const mysql = require("mysql2"); //подключаем БД
const express = require("express"); //подключаем фреймворк express
const expressHbs = require("express-handlebars");
const hbs = require("hbs");
const bcrypt = require("bcryptjs"); //для генерации hash-пароля, длина хэша 60, поэтому в БД  поле Pass надо увеличить мин до 60

const app = express(); //создаем объект приложение
const port = 3000;


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
//маршрут на ошибку регистрации - уже есть в базе
app.get("/createfault", function(req, res){
    res.render("createfault.hbs", {title: "Ошибка регистрации"});
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

// РЕГИСТРАЦИЯ В БАЗЕ travel В ТАБЛИЦЕ users
// ===================================================
//

//получаем отправленные данные из формы со страницы «Регистрация» create.hbs и добавляем их в БД
//.post(маршрут, разбор URL, функция) 
app.post("/create", urlencodedParser, function (req, res) {
    try {
        if (!req.body) {
            return res.sendStatus(400);
            console.log("Ошибка при регистрации", err);
        }
        //проверяем на дубль         
        pool.query("SELECT `Name`, `login` FROM users WHERE `Name` = '" + req.body.name + "' OR Login = '" + req.body.login + "'", (err, rows) => {
            if (err) {
                res.status(400);
                console.log("Ошибка при чтении из бд", err);
            } else if (typeof rows !== 'undefined' && rows.length > 0) {
                console.log('есть в бд')
                res.redirect("/createfault");
                return true;

                //и если нет дубля, добавляем пользователя в БД 				
            } else {
                const Name = req.body.name;
                const Login = req.body.login;

                //генерируем hash-пароль из переданного пороля в реквесте
                const salt = bcrypt.genSaltSync(7);
                const Pass = bcrypt.hashSync(req.body.pass, salt);
                //параметризация ???	
                pool.query("INSERT INTO users (Name, Login, Pass) VALUES (?,?,?)", [Name, Login, Pass], function (err, data) {
                    if (err) return console.log(err);
                    //пока просто перенаправляем на index.hbs, можно добавить иное: страницу, алерт и т.п.
                    res.redirect("/");
                    //выводим в консоль в случае успеха
                    console.log("Добавил в базу");
                })
            }
        })
    } catch (e) {
        console.log(e);
        res.status(400).send('Registration error');
    }
});

app.listen(port, function () {
    console.log(`Сервер ожидает подключения на ${port} порту...`);
});