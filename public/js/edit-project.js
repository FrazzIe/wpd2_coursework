const editProjectForm = document.getElementById("edit-project-form");

editProjectForm.addEventListener("submit", function(event) {
    axios.post("/projects/edit/" + document.getElementById("edit-project-id").value, {
        title: document.getElementById("edit-project-title").value,
        module: document.getElementById("edit-project-module").value,
        end_date: document.getElementById("edit-project-end-date").value,
        due_date: document.getElementById("edit-project-due-date").value,
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