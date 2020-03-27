const logoutForm = document.getElementById("logout-form");

logoutForm.addEventListener("submit", function(event) {
    axios.get("/logout", {}).then((resp) => {
        window.location.href = "/"
        console.log(resp);
    }).catch((error) => {
        console.log(error);
    });
    event.preventDefault();
});