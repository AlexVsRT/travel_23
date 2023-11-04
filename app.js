const mysql = require("mysql2"); //подключаем БД
const express = require("express"); //подключаем фреймворк express
const expressHbs = require("express-handlebars");
const hbs = require("hbs");
const bcrypt = require("bcryptjs"); //для генерации hash-пароля, длина хэша 60, поэтому в БД  поле Pass надо увеличить мин до 60
const jwt = require("jsonwebtoken");
const JwtStrategy = require("passport-jwt").Strategy; // подключаем passpоrt и стратегию
const ExtractJwt = require("passport-jwt").ExtractJwt;
const passport = require("passport");

const app = express(); //создаем объект приложение
const port = 3000;

const secretKey = "secret";

let opts = {}; // создаем параметры для работы стратегии c 2 парметрами
opts.jwtFromRequest = ExtractJwt.fromBodyField("jwt");  //берем из реквеста token
opts.secretOrKey = secretKey;

//создаем стратегию
passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    return done(null, jwt_payload.login);
}));

//парсер URL – разбирает URL
const urlencodedParser = express.urlencoded({ extended: false });

// создаем парсер для данных в формате json
const bodyParser = express.json();

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
app.get("/", function (req, res) {
    res.render("index.hbs", { title: "travel" });
});
// возвращаем форму для добавления данных
app.get("/create", function (req, res) {
    res.render("create.hbs", { title: "Регистрация" });
});
//маршрут на ошибку регистрации - уже есть в базе
app.get("/createfault", function (req, res) {
    res.render("createfault.hbs", { title: "Ошибка регистрации" });
});
// возвращаем браузеру форму для авторизации данных
app.get("/avtoriz", function (req, res) {
    res.render("avtoriz.hbs", { title: "Авторизация" });
});

// возвращаем форму с турами
app.get("/tours", function (req, res) {
    res.render("tours.hbs", { title: "Наши туры" });
});

// возвращаем форму о нас
app.get("/contacts", function (req, res) {
    res.render("contacts.hbs", { title: "О нас" });
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

// АВТОРИЗАЦИЯ НА САЙТЕ ПО ИМЕЮЩЕЙСЯ ИНФОРМАЦИИ В БАЗЕ В ТАБЛИЦЕ users
// ===================================================
//

// получаем отправленные данные из формы
app.post("/avtoriz", urlencodedParser, function (req, res) {
    try {
        if (!req.body) {
            return res.sendStatus(400);
        }
        //console.log(`${req.body.login}`);
        //берем из базы данные по Login  
        pool.query("SELECT * FROM users WHERE `Login` = '" + req.body.login + "'", (err, result) => {
            if (err) {
                res.sendStatus(500);
                console.log("Ошибка при чтении из бд", err);
                // проверка наличия в БД, если пустая строка, то нет в БД
            } else if (result.length <= 0) {
                console.log(`пользователя ${req.body.login} нет в бд`);
                res.sendStatus(401);
            } else {
                //сравнение hash-пароля из запроса и полученного хэша пароля объекта из базы, спец.функцией
                const match = bcrypt.compareSync(req.body.pass, result[0].Pass);

                //Если true мы пускаем юзера 
                if (match) {
                    //генерируем токен
                    const token = jwt.sign({
                        id_user: result[0].ID,
                        login: result[0].Login
                    }, secretKey, { expiresIn: 120 * 120 });  //можно "1h" и т.п.
                    res.status(200).json({ name: result[0].Name, token: `${token}` });
                    console.log(`Пользователь с таким именем - ${req.body.login} найден в бд, пароль верный,  токен +!`);
                } else {
                    //Выкидываем ошибку что пароль не верный
                    res.status(403).send(`введен не верный пароль`);
                    console.log(`Пользователь с таким именем - ${req.body.login} есть, но пароль не верный!`);
                }
            }
        });
    } catch (e) {
        console.log(e);
        res.status(400).send('Autorization error');
    }
});

/// РАБОТА С ТАБЛЦЕЙ remarks для ОТЗЫВОВ
// ===================================================
//

//маршрут на страницу с отзывами
app.get("/remarks-all", (req, res) => {
    pool.query(`SELECT * FROM remarks`, (err, rows) => {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        } else {
            res.status(200).render("remarks-all.hbs", {
                title: "Отзывы",
                remarks: rows
            });
            //можно отдавать даные в json
            //res.status(200).json(data);
        }
    });
});

app.post("/remarks-all", bodyParser, passport.authenticate("jwt", { session: false }), (req, res) => {
    // console.log(req.body);
    if (!req.body || !req.body.tema || !req.body.text) {
        return res.sendStatus(400);
    }
    pool.query(`SELECT id FROM users WHERE login='${req.user}'`, (err, rows, fields) => {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        } else {
            let id = rows[0].id;
            pool.query(`INSERT INTO remarks (id_user, tema, text) VALUES (${id},'${req.body.tema}','${req.body.text}')`, (err, rows, fields) => {
                if (err) {
                    console.log(err);
                    return res.sendStatus(500);
                } else {
                    return res.sendStatus(200)//.render("remarks-all.hbs");
                }
            });
        }
    });
});

app.listen(port, function () {
    console.log(`Сервер ожидает подключения на ${port} порту...`);
});