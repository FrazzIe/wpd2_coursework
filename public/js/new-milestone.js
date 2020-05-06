const newMilestoneForm = document.getElementById("new-milestone-form");

newMilestoneForm.addEventListener("submit", function(event) {
    axios.post("/milestones/" + document.getElementById("new-milestone-project-id").value + "/add", {
        title: document.getElementById("new-milestone-title").value,
        desc: document.getElementById("new-milestone-desc").value,
    }).then((resp) => {
        if (resp.data) {
            if (resp.data != "ok") {
                $("#errorModalTitle").text("An error occurred");
                $("#errorModalText").text(resp.data);
                $("#errorModal").modal("show");
            } else {
                window.location.href = "/milestones/" + document.getElementById("new-milestone-project-id").value
            }
        }
    }).catch((error) => {
        console.log(error);
    });
    
    event.preventDefault();
});