const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

loginForm.addEventListener("submit", function(event) {
    axios.post("/login", {
        username: document.getElementById("login-username").value,
        password: document.getElementById("login-password").value,
    }).then((resp) => {
        if (resp.data) {
            if (resp.data != "ok") {
                $("#register-modal").modal("hide");
                $("#errorModalTitle").text("An error occurred");
                $("#errorModalText").text(resp.data);
                $("#errorModal").modal("show");
            } else {
                window.location.href = "/"
            }
        }
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
        if (resp.data) {
            if (resp.data != "ok") {
                $("#register-modal").modal("hide");
                $("#errorModalTitle").text("An error occurred");
                $("#errorModalText").text(resp.data);
                $("#errorModal").modal("show");
            } else {
                $("#register-modal").modal("hide");
                $("#errorModalTitle").text("Account created");
                $("#errorModalText").text("A confirmation email has been sent, please verify your account before logging in!");
                $("#errorModal").modal("show");
            }
        }                
    }).catch((error) => {
        console.log(error);
    });
    event.preventDefault();
});