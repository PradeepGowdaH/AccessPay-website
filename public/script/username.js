document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/first-name");
    const data = await response.json();
    const usernameDisplays = document.querySelectorAll(".username-display");
    usernameDisplays.forEach((element) => {
        const first_name = data.firstName;
        const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="black" class="bi bi-person" viewBox="0 0 16 16">
        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM1 15s1-4 7-4 7 4 7 4H1z"/>
      </svg>`;
      element.innerHTML = `${first_name}`;
    });
  } catch (error) {
    console.error("Error fetching first name:", error);
  }
});