const API_BASE_URL = "https://dev-avice231.users.info.unicaen.fr/semestre4/bikestores/bikestores-api";
const API_KEY = "e8f1997c763";

const currentUser = JSON.parse(sessionStorage.getItem("user"));

const profileForm = document.getElementById("profileForm");
const messageBox = document.getElementById("messageBox");

const employeeNameInput = document.getElementById("employeeName");
const employeeEmailInput = document.getElementById("employeeEmail");
const employeePasswordInput = document.getElementById("employeePassword");
const employeeRoleInput = document.getElementById("employeeRole");
const employeeStoreInput = document.getElementById("employeeStore");

/**
 * Sends an HTTP request and parses JSON response.
 *
 * @param {string} url - The request URL.
 * @param {RequestInit} [options={}] - Fetch options.
 * @returns {Promise<{response: Response, data: any}>} Response and parsed payload.
 */
async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
}

/**
 * Loads connected user profile and fills form fields.
 *
 * @returns {Promise<void>} A promise resolved when profile is loaded.
 */
async function loadProfile() {
    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/employees/${currentUser.employee_id}`);

        if (!response.ok) {
            messageBox.className = "mb-3 text-danger";
            messageBox.textContent = data.error || "Unable to load profile.";
            return;
        }

        employeeNameInput.value = data.employee_name;
        employeeEmailInput.value = data.employee_email;
        employeePasswordInput.value = data.employee_password;
        employeeRoleInput.value = data.employee_role;
        employeeStoreInput.value = data.store_name;
    } catch (error) {
        messageBox.className = "mb-3 text-danger";
        messageBox.textContent = "Unable to load profile.";
        console.error(error);
    }
}

/**
 * Handles profile update form submission.
 *
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>} A promise resolved when update request completes.
 */
async function handleProfileSubmit(event) {
    event.preventDefault();

    const payload = {
        store_id: currentUser.store_id,
        employee_name: employeeNameInput.value.trim(),
        employee_email: employeeEmailInput.value.trim(),
        employee_password: employeePasswordInput.value.trim(),
        employee_role: currentUser.employee_role
    };

    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/employees/${currentUser.employee_id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": API_KEY
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            messageBox.className = "mb-3 text-danger";
            messageBox.textContent = data.error || "Unable to update profile.";
            return;
        }

        const updatedUser = {
            ...currentUser,
            employee_name: payload.employee_name,
            employee_email: payload.employee_email
        };

        sessionStorage.setItem("user", JSON.stringify(updatedUser));

        messageBox.className = "mb-3 text-success";
        messageBox.textContent = "Profile updated successfully.";
    } catch (error) {
        messageBox.className = "mb-3 text-danger";
        messageBox.textContent = "Unable to update profile.";
        console.error(error);
    }
}

profileForm.addEventListener("submit", handleProfileSubmit);

loadProfile();