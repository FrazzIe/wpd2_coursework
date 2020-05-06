const editMilestoneForm = document.getElementById("edit-milestone-form");

editMilestoneForm.addEventListener("submit", function(event) {
    axios.post("/milestones/" + document.getElementById("edit-milestone-project-id").value + "/edit/" + document.getElementById("edit-milestone-id").value, {
        title: document.getElementById("edit-milestone-title").value,
        desc: document.getElementById("edit-milestone-description").value,
    }).then((resp) => {
        if (resp.data) {
            if (resp.data != "ok") {
                $("#errorModalTitle").text("An error occurred");
                $("#errorModalText").text(resp.data);
                $("#errorModal").modal("show");
            } else {
                window.location.href = "/milestones/" + document.getElementById("edit-milestone-project-id").value
            }
        }
    }).catch((error) => {
        console.log(error);
    });
    
    event.preventDefault();
});