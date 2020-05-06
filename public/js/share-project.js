const shareProjectForm = document.getElementById("project-share-form");

shareProjectForm.addEventListener("submit", function(event) {
    console.log(shareProjectForm.dataset.projectId)
    axios.post("/projects/share/" + shareProjectForm.dataset.projectId, {
    }).then((resp) => {
        if (resp.data) {
            if (resp.data.error) {
                $("#errorModalTitle").text("An error occurred");
                $("#errorModalText").text(resp.data.error);
                $("#errorModal").modal("show");
            } else if(resp.data.url) {
                $("#project-share-link").text(resp.data.url);
                $("#project-share-modal").modal("show");
            }
        }
    }).catch((error) => {
        console.log(error);
    });
    
    event.preventDefault();
});

function copyURL() {
    /* Get the text field */
    var copyText = document.getElementById("project-share-link");

    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /*For mobile devices*/

    /* Copy the text inside the text field */
    document.execCommand("copy");
}