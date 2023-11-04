//видимоcть блока для авторизованных
if (userName !== null) {
    document.getElementById("review-form").style.display = "block";
};

//отлавливание кнопки "выход" с header  => сокрытие блока для добавки отзыва
document.getElementById("logOut").addEventListener("click", e => {
    e.preventDefault();
    document.getElementById("review-form").style.display = "none";
});

//--------------
//добавление отзывов в таблицу remarks для авторизованными пользователей
//--------------
//перехватываем данные из формы
document.getElementById("btn-primary").addEventListener("click", e => {
    e.preventDefault();
    // получаем данные формы для ввода отзыва
    let avtorizForm = document.forms["review-form"];
    let tema_inp = avtorizForm.elements["review-form-tema-inp"].value;
    let text_inp = avtorizForm.elements["review-form-text-inp"].value;
    let jwt = localStorage.getItem("token");
    if (!jwt) {
        //маршрут на авторизацию
        return null;
    }
    //формируем тело запроса, но теперь в json   
    var body = `{
                "jwt": "${localStorage.getItem("token")}",
                "tema": "${tema_inp}",
                "text": "${text_inp}"
            }`;
    
    //делаем ajax POST запрос к серверу
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/remarks-all', true);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader('Content-Type', "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status == 200) {
                //добавить отзыв
                console.log("отзыв в БД внесен");
                console.log(body);
                window.location.reload();

                //далее if возможно лишние, т.к. авторизация происходит раньше, неавторизованный просто не видит эту форму
            } else if (xhr.status == 403 || xhr.status == 401) {
                //видимость блока об ошибке 
            } else {
                //
            }
        }
    }
    xhr.send(body);
});