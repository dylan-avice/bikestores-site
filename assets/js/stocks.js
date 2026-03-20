const API_BASE_URL = "https://dev-avice231.users.info.unicaen.fr/semestre4/bikestores/bikestores-api";
const API_KEY = "e8f1997c763";
const ITEMS_PER_PAGE = 50;

const currentUser = JSON.parse(sessionStorage.getItem("user"));

const tableBody = document.getElementById("stocksTableBody");
const addStockBtn = document.getElementById("addStockBtn");
const messageBox = document.getElementById("messageBox");
let searchProductInput = document.getElementById("searchProduct");

const storeFilterContainer = document.getElementById("storeFilterContainer");
let storeFilter = null;

const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");

const stockForm = document.getElementById("stockForm");
const stockIdInput = document.getElementById("stockId");
const stockStoreInput = document.getElementById("stockStore");
const stockProductInput = document.getElementById("stockProduct");
const stockQuantityInput = document.getElementById("stockQuantity");
const stockModalTitle = document.getElementById("stockModalTitle");

const stockModal = new bootstrap.Modal(document.getElementById("stockModal"));

let allStocks = [];
let currentPage = 1;
let allStores = [];

/**
 * Displays a feedback message in the message area.
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
 * Clears the feedback message.
 *
 * @returns {void}
 */
function clearMessage() {
    messageBox.textContent = "";
}

/**
 * Checks whether the current user can manage stock records.
 *
 * @returns {boolean} True when management actions are allowed.
 */
function canManageStocks() {
    return ["employee", "chief", "it"].includes(currentUser.employee_role);
}

/**
 * Checks whether the current user can access all stores.
 *
 * @returns {boolean} True when all stores are visible.
 */
function canSeeAllStores() {
    return currentUser.employee_role === "it";
}

/**
 * Fetches JSON payload from API.
 *
 * @param {string} url - The request URL.
 * @param {RequestInit} [options={}] - Fetch options.
 * @returns {Promise<{response: Response, data: any}>} Response and parsed data.
 */
async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
}

/**
 * Loads stores and configures store selectors by role.
 *
 * @returns {Promise<void>} A promise resolved when store UI is initialized.
 */
async function loadStores() {
    const { data } = await fetchJson(`${API_BASE_URL}/stores`);
    allStores = data;

    stockStoreInput.innerHTML = "";

    data.forEach(store => {
        if (!canSeeAllStores() && store.store_id !== currentUser.store_id) {
            return;
        }

        stockStoreInput.innerHTML += `
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
            renderStocks();
        });
    } else {
        const store = data.find(s => s.store_id === currentUser.store_id);

        storeFilterContainer.innerHTML = `
            <div class="fw-bold">
                Your store: ${store ? store.store_name : currentUser.store_id}
            </div>
        `;

        stockStoreInput.value = String(currentUser.store_id);
        stockStoreInput.disabled = true;
    }
}

/**
 * Loads products and fills stock product selector.
 *
 * @returns {Promise<void>} A promise resolved when products are loaded.
 */
async function loadProducts() {
    const { data } = await fetchJson(`${API_BASE_URL}/products`);

    stockProductInput.innerHTML = "";

    data.forEach(product => {
        stockProductInput.innerHTML += `
            <option value="${product.product_id}">
                ${product.product_name}
            </option>
        `;
    });
}

/**
 * Returns stocks filtered by store visibility and product name query.
 *
 * @returns {Array<Object>} The filtered stock list.
 */
function getFilteredStocks() {
    let filtered = [...allStocks];

    if (!canSeeAllStores()) {
        filtered = filtered.filter(stock => stock.store_id === currentUser.store_id);
    } else if (storeFilter && storeFilter.value) {
        filtered = filtered.filter(stock => stock.store_id === parseInt(storeFilter.value, 10));
    }

    const productQuery = (searchProductInput ? searchProductInput.value : "").trim().toLowerCase();

    if (productQuery) {
        filtered = filtered.filter(stock =>
            String(stock.product_name).toLowerCase().includes(productQuery)
        );
    }

    return filtered;
}

/**
 * Renders stock rows for current page.
 *
 * @returns {void}
 */
function renderStocks() {
    const filteredStocks = getFilteredStocks();
    const totalPages = Math.max(1, Math.ceil(filteredStocks.length / ITEMS_PER_PAGE));

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filteredStocks.slice(start, end);

    tableBody.innerHTML = "";

    pageItems.forEach(stock => {
        const actions = canManageStocks()
            ? `
                <button class="btn btn-warning btn-sm me-1" onclick="editStock(${stock.stock_id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteStock(${stock.stock_id})">Delete</button>
            `
            : "";

        tableBody.innerHTML += `
            <tr>
                <td>${stock.stock_id}</td>
                <td>${stock.store_name}</td>
                <td>${stock.product_name}</td>
                <td>${stock.quantity}</td>
                <td>${actions}</td>
            </tr>
        `;
    });

    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

/**
 * Loads stock records and refreshes pagination.
 *
 * @returns {Promise<void>} A promise resolved when stocks are rendered.
 */
async function loadStocks() {
    clearMessage();

    try {
        const { data } = await fetchJson(`${API_BASE_URL}/stocks`);
        allStocks = data;
        currentPage = 1;
        renderStocks();
    } catch (error) {
        setMessage("Unable to load stocks.");
        console.error(error);
    }
}

/**
 * Resets stock modal form to default create state.
 *
 * @returns {void}
 */
function resetForm() {
    stockIdInput.value = "";
    stockQuantityInput.value = "";
    stockModalTitle.textContent = "Add Stock";

    if (!canSeeAllStores()) {
        stockStoreInput.value = String(currentUser.store_id);
    }
}

addStockBtn.addEventListener("click", () => {
    resetForm();
    stockModal.show();
});

/**
 * Handles stock create/update form submission.
 *
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>} A promise resolved when save operation ends.
 */
async function handleStockSubmit(event) {
    event.preventDefault();

    const id = stockIdInput.value;
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE_URL}/stocks/${id}` : `${API_BASE_URL}/stocks`;

    const selectedStoreId = parseInt(stockStoreInput.value, 10);

    if (!canSeeAllStores() && selectedStoreId !== currentUser.store_id) {
        setMessage("You can only manage stocks in your own store.");
        return;
    }

    const payload = {
        store_id: selectedStoreId,
        product_id: parseInt(stockProductInput.value, 10),
        quantity: parseInt(stockQuantityInput.value, 10)
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

        stockModal.hide();
        await loadStocks();
        setMessage(id ? "Stock updated successfully." : "Stock added successfully.", "success");
    } catch (error) {
        setMessage("Unable to save stock.");
        console.error(error);
    }
}

stockForm.addEventListener("submit", handleStockSubmit);

/**
 * Loads one stock entry and opens edit modal.
 *
 * @param {number} id - The stock identifier.
 * @returns {Promise<void>} A promise resolved when modal is populated.
 */
async function editStock(id) {
    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/stocks/${id}`);

        if (!response.ok) {
            setMessage(data.error || "Stock not found.");
            return;
        }

        if (!canSeeAllStores() && data.store_id !== currentUser.store_id) {
            setMessage("You can only edit stocks in your own store.");
            return;
        }

        stockIdInput.value = data.stock_id;
        stockStoreInput.value = data.store_id;
        stockProductInput.value = data.product_id;
        stockQuantityInput.value = data.quantity;
        stockModalTitle.textContent = "Edit Stock";

        stockModal.show();
    } catch (error) {
        setMessage("Unable to load stock.");
        console.error(error);
    }
}

/**
 * Deletes a stock entry after access checks and confirmation.
 *
 * @param {number} id - The stock identifier.
 * @returns {Promise<void>} A promise resolved when deletion is processed.
 */
async function deleteStock(id) {
    try {
        const { response: stockResponse, data: stockData } = await fetchJson(`${API_BASE_URL}/stocks/${id}`);

        if (!stockResponse.ok) {
            setMessage(stockData.error || "Stock not found.");
            return;
        }

        if (!canSeeAllStores() && stockData.store_id !== currentUser.store_id) {
            setMessage("You can only delete stocks in your own store.");
            return;
        }

        if (!confirm("Delete this stock?")) {
            return;
        }

        const { response, data } = await fetchJson(`${API_BASE_URL}/stocks/${id}`, {
            method: "DELETE",
            headers: {
                "X-API-KEY": API_KEY
            }
        });

        if (!response.ok) {
            setMessage(data.error || "Delete failed.");
            return;
        }

        await loadStocks();
        setMessage("Stock deleted successfully.", "success");
    } catch (error) {
        setMessage("Unable to delete stock.");
        console.error(error);
    }
}

prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderStocks();
    }
});

nextPageBtn.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(getFilteredStocks().length / ITEMS_PER_PAGE));

    if (currentPage < totalPages) {
        currentPage++;
        renderStocks();
    }
});

if (searchProductInput) {
    searchProductInput.addEventListener("input", () => {
        currentPage = 1;
        renderStocks();
    });
}

if (!canManageStocks()) {
    addStockBtn.style.display = "none";
}

loadStores();
loadProducts();
loadStocks();