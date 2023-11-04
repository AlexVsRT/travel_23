//перехватываем данные из формы
document.getElementById("submitLogin").addEventListener("click", e => {
    e.preventDefault();
    // получаем данные формы
    let avtorizForm = document.forms["avtorizForm"];
    let userLogin = avtorizForm.elements["login"].value;
    let userPass = avtorizForm.elements["pass"].value;
    //формируем тело запроса    
    var body = 'login=' + userLogin + '&pass=' + userPass;
    console.log(body);
    //делаем ajax запрос к серверу
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/avtoriz', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.responseType = 'json'

    xhr.onload = () => {
        if (xhr.status == 200) {
            let res = xhr.response;
            console.log(res);  //теперь респонс - json, поэтому не res = xhr.responseTxt
            let name = res.name;
            let jwt = res.token;
            localStorage.setItem("name", name);
            localStorage.setItem("token", jwt);
            //меняем видимость блока и формы
            document.getElementById("userInfo").style.display = "block";
            document.getElementById("userName").innerText = name;
            document.getElementById("avtorizForm").style.display = "none";

        } else if (xhr.status == 403 || xhr.status == 401) {
            //видимость блока об ошибке 
            $("#wrong-pass-message").show();
            $("#wrong-bd").hide();
        } else if (xhr.status == 500) {
            //видимость блока упал сервер БД
            $("#wrong-bd").show();
            $("#wrong-pass-message").hide();
        }
    }
    xhr.onerror = () => {
        console.log('упал http сервер')
        document.write('<h2>http down</h2>')
    }

    xhr.send(body);

});

// условный выход - удаляем токен, меняем видимость блоков и очищаем форму
document.getElementById("logOut").addEventListener("click", e => {
    e.preventDefault();
    document.getElementById("userName").innerText = "";
    document.getElementById("userInfo").style.display = "none";
    document.getElementById("avtorizForm").style.display = "block";
    document.getElementById('avtorizForm').reset()
    document.getElementById("wrong-pass-message").style.display = "none";
    localStorage.removeItem("name");
    localStorage.removeItem("token");
});