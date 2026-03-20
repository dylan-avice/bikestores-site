const API_BASE_URL = "https://dev-avice231.users.info.unicaen.fr/semestre4/bikestores/bikestores-api";
const API_KEY = "e8f1997c763";
const ITEMS_PER_PAGE = 50;

const currentUser = JSON.parse(sessionStorage.getItem("user"));

const tableBody = document.getElementById("employeesTableBody");
const addEmployeeBtn = document.getElementById("addEmployeeBtn");
const messageBox = document.getElementById("messageBox");
let searchNameInput = document.getElementById("searchName");

const storeFilterContainer = document.getElementById("storeFilterContainer");
let storeFilter = null;

const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");

const employeeForm = document.getElementById("employeeForm");
const employeeIdInput = document.getElementById("employeeId");
const employeeStoreInput = document.getElementById("employeeStore");
const employeeNameInput = document.getElementById("employeeName");
const employeeEmailInput = document.getElementById("employeeEmail");
const employeePasswordInput = document.getElementById("employeePassword");
const employeeRoleInput = document.getElementById("employeeRole");
const employeeModalTitle = document.getElementById("employeeModalTitle");

const employeeModal = new bootstrap.Modal(document.getElementById("employeeModal"));

let allEmployees = [];
let allStores = [];
let currentPage = 1;

/**
 * Displays a feedback message.
 *
 * @param {string} message - The message text.
 * @param {"error"|"success"} [type="error"] - The message type.
 * @returns {void}
 */
function setMessage(message, type = "error") {
    messageBox.className = `mb-3 ${type === "success" ? "text-success" : "text-danger"}`;
    messageBox.textContent = message;
}

/**
 * Clears the feedback area.
 *
 * @returns {void}
 */
function clearMessage() {
    messageBox.textContent = "";
}

/**
 * Checks whether the current user can open the employees page.
 *
 * @returns {boolean} True if access is allowed.
 */
function canAccessEmployeesPage() {
    return ["chief", "it"].includes(currentUser.employee_role);
}

/**
 * Checks whether the current user can access data from all stores.
 *
 * @returns {boolean} True if all stores are visible.
 */
function canSeeAllStores() {
    return currentUser.employee_role === "it";
}

/**
 * Checks whether the current user can create, edit, and delete employees.
 *
 * @returns {boolean} True if management actions are allowed.
 */
function canManageEmployees() {
    return ["chief", "it"].includes(currentUser.employee_role);
}

if (!canAccessEmployeesPage()) {
    window.location.href = "index.html";
}

/**
 * Fetches JSON data from the API.
 *
 * @param {string} url - The request URL.
 * @param {RequestInit} [options={}] - Fetch options.
 * @returns {Promise<{response: Response, data: any}>} The response and payload.
 */
async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
}

/**
 * Loads stores and initializes store selectors according to user role.
 *
 * @returns {Promise<void>} A promise resolved when store controls are ready.
 */
async function loadStores() {
    const { data } = await fetchJson(`${API_BASE_URL}/stores`);
    allStores = data;

    employeeStoreInput.innerHTML = "";

    data.forEach(store => {
        if (!canSeeAllStores() && store.store_id !== currentUser.store_id) {
            return;
        }

        employeeStoreInput.innerHTML += `
            <option value="${store.store_id}">
                ${store.store_name}
            </option>
        `;
    });

    if (canSeeAllStores()) {
        storeFilterContainer.innerHTML = `
            <select id="storeFilter" class="form-select">
                <option value="">All Stores</option>
            </select>
        `;

        storeFilter = document.getElementById("storeFilter");

        data.forEach(store => {
            storeFilter.innerHTML += `
                <option value="${store.store_id}">
                    ${store.store_name}
                </option>
            `;
        });

        storeFilter.addEventListener("change", () => {
            currentPage = 1;
            renderEmployees();
        });
    } else {
        const store = data.find(s => s.store_id === currentUser.store_id);

        storeFilterContainer.innerHTML = `
            <div class="fw-bold">
                Your store: ${store ? store.store_name : currentUser.store_id}
            </div>
        `;

        employeeStoreInput.value = String(currentUser.store_id);
        employeeStoreInput.disabled = true;
    }
}

/**
 * Configures role options allowed for the current user.
 *
 * @returns {void}
 */
function configureRoleOptions() {
    if (currentUser.employee_role === "chief") {
        employeeRoleInput.innerHTML = `<option value="employee">employee</option>`;
    } else if (currentUser.employee_role === "it") {
        employeeRoleInput.innerHTML = `
            <option value="employee">employee</option>
            <option value="chief">chief</option>
        `;
    }
}

/**
 * Returns employees filtered by current permissions and search query.
 *
 * @returns {Array<Object>} The filtered employee list.
 */
function getFilteredEmployees() {
    let filtered = [...allEmployees];

    if (!canSeeAllStores()) {
        filtered = filtered.filter(employee => employee.store_id === currentUser.store_id);
    } else if (storeFilter && storeFilter.value) {
        filtered = filtered.filter(employee => employee.store_id === parseInt(storeFilter.value, 10));
    }

    const nameQuery = (searchNameInput ? searchNameInput.value : "").trim().toLowerCase();

    if (nameQuery) {
        filtered = filtered.filter(employee =>
            String(employee.employee_name).toLowerCase().includes(nameQuery)
        );
    }

    return filtered;
}

/**
 * Renders employee rows for the current page.
 *
 * @returns {void}
 */
function renderEmployees() {
    const filteredEmployees = getFilteredEmployees();
    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE));

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filteredEmployees.slice(start, end);

    tableBody.innerHTML = "";

    pageItems.forEach(employee => {
        const actions = canManageEmployees()
            ? `
                <button class="btn btn-warning btn-sm me-1" onclick="editEmployee(${employee.employee_id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteEmployee(${employee.employee_id})">Delete</button>
            `
            : "";

        tableBody.innerHTML += `
            <tr>
                <td>${employee.employee_id}</td>
                <td>${employee.store_name}</td>
                <td>${employee.employee_name}</td>
                <td>${employee.employee_email}</td>
                <td>${employee.employee_role}</td>
                <td>${actions}</td>
            </tr>
        `;
    });

    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

/**
 * Loads employees from the API and refreshes the table.
 *
 * @returns {Promise<void>} A promise resolved after rendering employees.
 */
async function loadEmployees() {
    clearMessage();

    try {
        const { data } = await fetchJson(`${API_BASE_URL}/employees`);
        allEmployees = data;
        currentPage = 1;
        renderEmployees();
    } catch (error) {
        setMessage("Unable to load employees.");
        console.error(error);
    }
}

/**
 * Resets the employee modal form to default create state.
 *
 * @returns {void}
 */
function resetForm() {
    employeeIdInput.value = "";
    employeeNameInput.value = "";
    employeeEmailInput.value = "";
    employeePasswordInput.value = "";
    employeeModalTitle.textContent = "Add Employee";

    configureRoleOptions();

    if (!canSeeAllStores()) {
        employeeStoreInput.value = String(currentUser.store_id);
    }
}

addEmployeeBtn.addEventListener("click", () => {
    resetForm();
    employeeModal.show();
});

/**
 * Handles employee create/update submission.
 *
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>} A promise resolved when save operation finishes.
 */
async function handleEmployeeSubmit(event) {
    event.preventDefault();

    const id = employeeIdInput.value;
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE_URL}/employees/${id}` : `${API_BASE_URL}/employees`;

    const selectedStoreId = parseInt(employeeStoreInput.value, 10);
    const selectedRole = employeeRoleInput.value;

    if (currentUser.employee_role === "chief") {
        if (selectedStoreId !== currentUser.store_id) {
            setMessage("A chief can only manage employees in their own store.");
            return;
        }

        if (selectedRole !== "employee") {
            setMessage("A chief can only create or edit employees with role employee.");
            return;
        }
    }

    if (currentUser.employee_role === "it") {
        if (!["employee", "chief"].includes(selectedRole)) {
            setMessage("IT can only manage employee or chief roles here.");
            return;
        }
    }

    const payload = {
        store_id: selectedStoreId,
        employee_name: employeeNameInput.value.trim(),
        employee_email: employeeEmailInput.value.trim(),
        employee_password: employeePasswordInput.value.trim(),
        employee_role: selectedRole
    };

    try {
        const { response, data } = await fetchJson(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": API_KEY
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            setMessage(data.error || "Operation failed.");
            return;
        }

        employeeModal.hide();
        await loadEmployees();
        setMessage(id ? "Employee updated successfully." : "Employee added successfully.", "success");
    } catch (error) {
        setMessage("Unable to save employee.");
        console.error(error);
    }
}

employeeForm.addEventListener("submit", handleEmployeeSubmit);

/**
 * Loads an employee and opens the modal in edit mode.
 *
 * @param {number} id - The employee identifier.
 * @returns {Promise<void>} A promise resolved when modal fields are filled.
 */
async function editEmployee(id) {
    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/employees/${id}`);

        if (!response.ok) {
            setMessage(data.error || "Employee not found.");
            return;
        }

        if (!canSeeAllStores() && data.store_id !== currentUser.store_id) {
            setMessage("You can only edit employees in your own store.");
            return;
        }

        employeeIdInput.value = data.employee_id;
        employeeStoreInput.value = data.store_id;
        employeeNameInput.value = data.employee_name;
        employeeEmailInput.value = data.employee_email;
        employeePasswordInput.value = data.employee_password;

        configureRoleOptions();

        if ([...employeeRoleInput.options].some(option => option.value === data.employee_role)) {
            employeeRoleInput.value = data.employee_role;
        }

        employeeModalTitle.textContent = "Edit Employee";
        employeeModal.show();
    } catch (error) {
        setMessage("Unable to load employee.");
        console.error(error);
    }
}

/**
 * Deletes an employee if permissions and confirmation checks pass.
 *
 * @param {number} id - The employee identifier.
 * @returns {Promise<void>} A promise resolved when deletion completes.
 */
async function deleteEmployee(id) {
    try {
        const { response: employeeResponse, data: employeeData } = await fetchJson(`${API_BASE_URL}/employees/${id}`);

        if (!employeeResponse.ok) {
            setMessage(employeeData.error || "Employee not found.");
            return;
        }

        if (!canSeeAllStores() && employeeData.store_id !== currentUser.store_id) {
            setMessage("You can only delete employees in your own store.");
            return;
        }

        if (!confirm("Delete this employee?")) {
            return;
        }

        const { response, data } = await fetchJson(`${API_BASE_URL}/employees/${id}`, {
            method: "DELETE",
            headers: {
                "X-API-KEY": API_KEY
            }
        });

        if (!response.ok) {
            setMessage(data.error || "Delete failed.");
            return;
        }

        await loadEmployees();
        setMessage("Employee deleted successfully.", "success");
    } catch (error) {
        setMessage("Unable to delete employee.");
        console.error(error);
    }
}

prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderEmployees();
    }
});

nextPageBtn.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(getFilteredEmployees().length / ITEMS_PER_PAGE));

    if (currentPage < totalPages) {
        currentPage++;
        renderEmployees();
    }
});

if (searchNameInput) {
    searchNameInput.addEventListener("input", () => {
        currentPage = 1;
        renderEmployees();
    });
}

if (!canManageEmployees()) {
    addEmployeeBtn.style.display = "none";
}

configureRoleOptions();
loadStores();
loadEmployees();