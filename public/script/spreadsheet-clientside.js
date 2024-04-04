document.addEventListener("DOMContentLoaded", function () {
  const importButton = document.querySelector(".btn-export");
  const fileInput = document.getElementById("fileInput");
  if (importButton && fileInput) {
    importButton.addEventListener("click", function () {
      fileInput.click(); // Trigger the click event of the hidden file input
    });

    fileInput.addEventListener("change", function (event) {
      // Handle the file selection here
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        fetch("/upload", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.text())
          .then((data) => {
            console.log("Success:", data);
            alert("Data uploaded successfully");
          })
          .catch((error) => {
            console.error("Error:", error);
            alert("Error uploading data");
          });
      }
    });
  }
});