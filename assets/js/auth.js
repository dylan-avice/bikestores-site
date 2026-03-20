const form = document.getElementById("loginForm");
const messageBox = document.getElementById("loginMessage");

const API_BASE_URL = "https://dev-avice231.users.info.unicaen.fr/semestre4/bikestores/bikestores-api";

/**
 * Handles the login form submission.
 *
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>} A promise resolved when the login request is processed.
 */
async function handleLoginSubmit(event) {
    event.preventDefault();

    messageBox.textContent = "";

    const employee_email = document.getElementById("employee_email").value.trim();
    const employee_password = document.getElementById("employee_password").value.trim();

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                employee_email,
                employee_password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            messageBox.textContent = data.error || "Login failed.";
            return;
        }

        sessionStorage.setItem("user", JSON.stringify(data.employee));

        window.location.href = "index.html";
    } catch (error) {
        messageBox.textContent = "Unable to contact the API.";
        console.error(error);
    }
}

form.addEventListener("submit", handleLoginSubmit);