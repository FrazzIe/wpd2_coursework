const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

loginForm.addEventListener("submit", function(event) {
    axios.post("/login", {
        username: document.getElementById("login-username").value,
        password: document.getElementById("login-password").value,
    }).then((resp) => {
        console.log(resp);
        window.location.href = "/"
    }).catch((error) => {
        console.log(error);
    });
    event.preventDefault();
});

registerForm.addEventListener("submit", function(event) {
    axios.post("/register", {
        email: document.getElementById("register-email").value,
        username: document.getElementById("register-username").value,
        password: document.getElementById("register-password").value,
    }).then((resp) => {
        console.log(resp);
        window.location.href = "/"
    }).catch((error) => {
        console.log(error);
    });
    event.preventDefault();
});