const newProjectForm = document.getElementById("new-project-form");

newProjectForm.addEventListener("submit", function(event) {
    axios.post("/projects/add", {
        title: document.getElementById("new-project-title").value,
        module: document.getElementById("new-project-module").value,
        end_date: document.getElementById("new-project-end-date").value,
        due_date: document.getElementById("new-project-due-date").value,
    }).then((resp) => {
        if (resp.data) {
            if (resp.data != "ok") {
                $("#errorModalTitle").text("An error occurred");
                $("#errorModalText").text(resp.data);
                $("#errorModal").modal("show");
            } else {
                window.location.href = "/projects"
            }
        }
    }).catch((error) => {
        console.log(error);
    });
    
    event.preventDefault();
});