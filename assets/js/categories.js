const API_BASE_URL = "https://dev-avice231.users.info.unicaen.fr/semestre4/bikestores/bikestores-api";
const API_KEY = "e8f1997c763";
const ITEMS_PER_PAGE = 50;

const tableBody = document.getElementById("categoriesTableBody");
const addBtn = document.getElementById("addCategoryBtn");
const messageBox = document.getElementById("messageBox");

const categoryForm = document.getElementById("categoryForm");
const categoryIdInput = document.getElementById("categoryId");
const categoryNameInput = document.getElementById("categoryName");
const searchNameInput = document.getElementById("searchName");

const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");

const categoryModal = new bootstrap.Modal(document.getElementById("categoryModal"));
const categoryModalTitle = document.getElementById("categoryModalTitle");

let categories = [];
let currentPage = 1;

/**
 * Displays a feedback message in the page message box.
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
 * Clears the currently displayed feedback message.
 *
 * @returns {void}
 */
function clearMessage() {
    messageBox.textContent = "";
}

/**
 * Sends a request and parses the JSON body.
 *
 * @param {string} url - The request URL.
 * @param {RequestInit} [options={}] - Fetch options.
 * @returns {Promise<{response: Response, data: any}>} Parsed response pair.
 */
async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
}

/**
 * Loads all categories and refreshes the table.
 *
 * @returns {Promise<void>} A promise resolved after rendering categories.
 */
async function loadCategories() {
    clearMessage();

    try {
        const { data } = await fetchJson(`${API_BASE_URL}/categories`);
        categories = data;
        currentPage = 1;
        renderCategories();
    } catch (error) {
        setMessage("Unable to load categories.");
        console.error(error);
    }
}

/**
 * Renders categories for the current page.
 *
 * @returns {void}
 */
function renderCategories() {
    const filteredCategories = getFilteredCategories();
    const totalPages = Math.max(1, Math.ceil(filteredCategories.length / ITEMS_PER_PAGE));

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filteredCategories.slice(start, start + ITEMS_PER_PAGE);

    tableBody.innerHTML = "";

    pageItems.forEach(category => {
        tableBody.innerHTML += `
            <tr>
                <td>${category.category_id}</td>
                <td>${category.category_name}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-1" onclick="editCategory(${category.category_id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCategory(${category.category_id})">Delete</button>
                </td>
            </tr>
        `;
    });

    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

/**
 * Returns categories filtered by name.
 *
 * @returns {Array<Object>} The filtered category list.
 */
function getFilteredCategories() {
    const query = searchNameInput.value.trim().toLowerCase();

    if (!query) {
        return categories;
    }

    return categories.filter(category =>
        String(category.category_name).toLowerCase().includes(query)
    );
}

addBtn.addEventListener("click", () => {
    categoryIdInput.value = "";
    categoryNameInput.value = "";
    categoryModalTitle.textContent = "Add Category";
    categoryModal.show();
});

/**
 * Handles category create/update form submission.
 *
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>} A promise resolved when save operation completes.
 */
async function handleCategorySubmit(event) {
    event.preventDefault();

    const id = categoryIdInput.value;
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE_URL}/categories/${id}` : `${API_BASE_URL}/categories`;

    const payload = {
        category_name: categoryNameInput.value.trim()
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

        categoryModal.hide();
        await loadCategories();
        setMessage(id ? "Category updated successfully." : "Category added successfully.", "success");
    } catch (error) {
        setMessage("Unable to save category.");
        console.error(error);
    }
}

categoryForm.addEventListener("submit", handleCategorySubmit);

/**
 * Loads one category and opens edit modal.
 *
 * @param {number} id - The category identifier.
 * @returns {Promise<void>} A promise resolved when modal is ready.
 */
async function editCategory(id) {
    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/categories/${id}`);

        if (!response.ok) {
            setMessage(data.error || "Category not found.");
            return;
        }

        categoryIdInput.value = data.category_id;
        categoryNameInput.value = data.category_name;
        categoryModalTitle.textContent = "Edit Category";
        categoryModal.show();
    } catch (error) {
        setMessage("Unable to load category.");
        console.error(error);
    }
}

/**
 * Deletes a category after confirmation.
 *
 * @param {number} id - The category identifier.
 * @returns {Promise<void>} A promise resolved when deletion finishes.
 */
async function deleteCategory(id) {
    if (!confirm("Delete this category ?")) return;

    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/categories/${id}`, {
            method: "DELETE",
            headers: {
                "X-API-KEY": API_KEY
            }
        });

        if (!response.ok) {
            setMessage(data.error || "Delete failed.");
            return;
        }

        await loadCategories();
        setMessage("Category deleted successfully.", "success");
    } catch (error) {
        setMessage("Unable to delete category.");
        console.error(error);
    }
}

prevPageBtn.onclick = () => {
    if (currentPage > 1) {
        currentPage--;
        renderCategories();
    }
};

nextPageBtn.onclick = () => {
    const totalPages = Math.max(1, Math.ceil(getFilteredCategories().length / ITEMS_PER_PAGE));

    if (currentPage < totalPages) {
        currentPage++;
        renderCategories();
    }
};

searchNameInput.addEventListener("input", () => {
    currentPage = 1;
    renderCategories();
});

loadCategories();