const API_BASE_URL = "https://dev-avice231.users.info.unicaen.fr/semestre4/bikestores/bikestores-api";
const API_KEY = "e8f1997c763";
const ITEMS_PER_PAGE = 50;

const currentUser = JSON.parse(sessionStorage.getItem("user"));

const tableBody = document.getElementById("storesTableBody");
const addStoreBtn = document.getElementById("addStoreBtn");
const messageBox = document.getElementById("messageBox");
let searchNameInput = document.getElementById("searchName");

const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");

const storeForm = document.getElementById("storeForm");

const storeId = document.getElementById("storeId");
const storeName = document.getElementById("storeName");
const storePhone = document.getElementById("storePhone");
const storeEmail = document.getElementById("storeEmail");
const storeStreet = document.getElementById("storeStreet");
const storeCity = document.getElementById("storeCity");
const storeState = document.getElementById("storeState");
const storeZip = document.getElementById("storeZip");

const storeModal = new bootstrap.Modal(document.getElementById("storeModal"));

let stores = [];
let currentPage = 1;

/**
 * Displays a feedback message to the user.
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
 * Clears the feedback message box.
 *
 * @returns {void}
 */
function clearMessage() {
    messageBox.textContent = "";
}

/**
 * Sends a request and returns parsed JSON with original response.
 *
 * @param {string} url - The request URL.
 * @param {RequestInit} [options={}] - Fetch options.
 * @returns {Promise<{response: Response, data: any}>} Response and JSON payload.
 */
async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
}

/**
 * Loads stores from API and refreshes current page.
 *
 * @returns {Promise<void>} A promise resolved after stores are rendered.
 */
async function loadStores() {
    clearMessage();

    try {
        const { data } = await fetchJson(`${API_BASE_URL}/stores`);
        stores = data;
        currentPage = 1;
        renderStores();
    } catch (error) {
        setMessage("Unable to load stores.");
        console.error(error);
    }
}

/**
 * Renders stores for the active page.
 *
 * @returns {void}
 */
function renderStores() {
    const filteredStores = getFilteredStores();
    const totalPages = Math.max(1, Math.ceil(filteredStores.length / ITEMS_PER_PAGE));

    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageStores = filteredStores.slice(start, start + ITEMS_PER_PAGE);

    tableBody.innerHTML = "";

    pageStores.forEach(store => {

        tableBody.innerHTML += `
            <tr>
                <td>${store.store_id}</td>
                <td>${store.store_name}</td>
                <td>${store.phone}</td>
                <td>${store.email}</td>
                <td>${store.street}</td>
                <td>${store.city}</td>
                <td>${store.state}</td>
                <td>${store.zip_code}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-1" onclick="editStore(${store.store_id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteStore(${store.store_id})">Delete</button>
                </td>
            </tr>
        `;

    });

    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;

}

/**
 * Returns stores filtered by store name.
 *
 * @returns {Array<Object>} The filtered store list.
 */
function getFilteredStores() {
    const query = (searchNameInput ? searchNameInput.value : "").trim().toLowerCase();

    if (!query) {
        return stores;
    }

    return stores.filter(store =>
        String(store.store_name).toLowerCase().includes(query)
    );
}

addStoreBtn.addEventListener("click", () => {
    storeForm.reset();
    storeId.value = "";
    storeModal.show();
});

/**
 * Handles store create/update form submission.
 *
 * @param {SubmitEvent} e - The form submit event.
 * @returns {Promise<void>} A promise resolved when save operation finishes.
 */
async function handleStoreSubmit(e){

    e.preventDefault();

    const payload = {
        store_name: storeName.value,
        phone: storePhone.value,
        email: storeEmail.value,
        street: storeStreet.value,
        city: storeCity.value,
        state: storeState.value,
        zip_code: storeZip.value
    };

    const id = storeId.value;

    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE_URL}/stores/${id}` : `${API_BASE_URL}/stores`;

    try {
        const { response, data } = await fetchJson(url, {
            method,
            headers:{
                "Content-Type":"application/json",
                "X-API-KEY":API_KEY
            },
            body:JSON.stringify(payload)
        });

        if(!response.ok){
            setMessage(data.error || "Operation failed.");
            return;
        }

        storeModal.hide();
        await loadStores();
        setMessage(id ? "Store updated successfully." : "Store added successfully.", "success");
    } catch (error) {
        setMessage("Unable to save store.");
        console.error(error);
    }

}

storeForm.addEventListener("submit", handleStoreSubmit);

/**
 * Loads one store and opens edit modal.
 *
 * @param {number} id - The store identifier.
 * @returns {Promise<void>} A promise resolved when modal fields are filled.
 */
async function editStore(id){

    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/stores/${id}`);

        if (!response.ok) {
            setMessage(data.error || "Store not found.");
            return;
        }

        storeId.value = data.store_id;
        storeName.value = data.store_name;
        storePhone.value = data.phone;
        storeEmail.value = data.email;
        storeStreet.value = data.street;
        storeCity.value = data.city;
        storeState.value = data.state;
        storeZip.value = data.zip_code;

        storeModal.show();
    } catch (error) {
        setMessage("Unable to load store.");
        console.error(error);
    }

}

/**
 * Deletes a store after confirmation.
 *
 * @param {number} id - The store identifier.
 * @returns {Promise<void>} A promise resolved when deletion is processed.
 */
async function deleteStore(id){

    if(!confirm("Delete this store ?")) return;

    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/stores/${id}`,{
            method:"DELETE",
            headers:{ "X-API-KEY":API_KEY }
        });

        if (!response.ok) {
            setMessage(data.error || "Delete failed.");
            return;
        }

        await loadStores();
        setMessage("Store deleted successfully.", "success");
    } catch (error) {
        setMessage("Unable to delete store.");
        console.error(error);
    }

}

prevPageBtn.onclick = () => {

    if (currentPage > 1) {
        currentPage--;
        renderStores();
    }

};

nextPageBtn.onclick = () => {

    const totalPages = Math.max(1, Math.ceil(getFilteredStores().length / ITEMS_PER_PAGE));

    if (currentPage < totalPages) {
        currentPage++;
        renderStores();
    }

};

if (searchNameInput) {
    searchNameInput.addEventListener("input", () => {
        currentPage = 1;
        renderStores();
    });
}

loadStores();
