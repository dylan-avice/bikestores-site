const API_BASE_URL = "https://dev-avice231.users.info.unicaen.fr/semestre4/bikestores/bikestores-api";
const API_KEY = "e8f1997c763";
const ITEMS_PER_PAGE = 50;

const tableBody = document.getElementById("brandsTableBody");
const addBtn = document.getElementById("addBrandBtn");
const messageBox = document.getElementById("messageBox");

const brandForm = document.getElementById("brandForm");
const brandIdInput = document.getElementById("brandId");
const brandNameInput = document.getElementById("brandName");
let searchNameInput = document.getElementById("searchName");

if (!searchNameInput) {
    const pageContainer = document.querySelector(".container.mt-4");

    if (pageContainer) {
        const row = document.createElement("div");
        row.className = "row mb-3";
        row.innerHTML = `
            <div class="col-md-4">
                <label for="searchName" class="form-label">Search by Name</label>
                <input type="text" id="searchName" class="form-control" placeholder="Type a brand name...">
            </div>
        `;

        const messageBoxNode = document.getElementById("messageBox");
        if (messageBoxNode) {
            pageContainer.insertBefore(row, messageBoxNode);
        } else {
            pageContainer.appendChild(row);
        }

        searchNameInput = document.getElementById("searchName");
    }
}

const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");

const brandModal = new bootstrap.Modal(document.getElementById("brandModal"));
const brandModalTitle = document.getElementById("brandModalTitle");

let brands = [];
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
 * Clears the feedback area.
 *
 * @returns {void}
 */
function clearMessage() {
    messageBox.textContent = "";
}

/**
 * Fetches JSON data and returns both response and parsed payload.
 *
 * @param {string} url - The request URL.
 * @param {RequestInit} [options={}] - Fetch options.
 * @returns {Promise<{response: Response, data: any}>} The response and parsed JSON.
 */
async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
}

/**
 * Loads all brands from the API and refreshes pagination.
 *
 * @returns {Promise<void>} A promise resolved when brands are loaded.
 */
async function loadBrands() {

    clearMessage();

    try {

        const { data } = await fetchJson(`${API_BASE_URL}/brands`);

        brands = data;
        currentPage = 1;

        renderBrands();

    } catch (error) {

        setMessage("Unable to load brands.");
        console.error(error);

    }

}

/**
 * Renders the current paginated list of brands.
 *
 * @returns {void}
 */
function renderBrands() {
    const filteredBrands = getFilteredBrands();
    const totalPages = Math.max(1, Math.ceil(filteredBrands.length / ITEMS_PER_PAGE));

    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filteredBrands.slice(start, start + ITEMS_PER_PAGE);

    tableBody.innerHTML = "";

    pageItems.forEach(brand => {

        tableBody.innerHTML += `
            <tr>
                <td>${brand.brand_id}</td>
                <td>${brand.brand_name}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-1" onclick="editBrand(${brand.brand_id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBrand(${brand.brand_id})">Delete</button>
                </td>
            </tr>
        `;
    });

    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;

}

/**
 * Returns brands filtered by the current name query.
 *
 * @returns {Array<Object>} The filtered brand list.
 */
function getFilteredBrands() {
    const query = (searchNameInput ? searchNameInput.value : "").trim().toLowerCase();

    if (!query) {
        return brands;
    }

    return brands.filter(brand =>
        String(brand.brand_name).toLowerCase().includes(query)
    );
}

addBtn.addEventListener("click", () => {

    brandIdInput.value = "";
    brandNameInput.value = "";

    brandModalTitle.textContent = "Add Brand";

    brandModal.show();

});

/**
 * Handles brand form submission for create and update operations.
 *
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>} A promise resolved when save operation completes.
 */
async function handleBrandSubmit(event) {

    event.preventDefault();

    const id = brandIdInput.value;
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE_URL}/brands/${id}` : `${API_BASE_URL}/brands`;

    const payload = {
        brand_name: brandNameInput.value.trim()
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

        brandModal.hide();
        await loadBrands();
        setMessage(id ? "Brand updated successfully." : "Brand added successfully.", "success");
    } catch (error) {
        setMessage("Unable to save brand.");
        console.error(error);
    }

}

brandForm.addEventListener("submit", handleBrandSubmit);

/**
 * Loads one brand and opens the modal in edit mode.
 *
 * @param {number} id - The brand identifier.
 * @returns {Promise<void>} A promise resolved when the modal is populated.
 */
async function editBrand(id) {

    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/brands/${id}`);

        if (!response.ok) {
            setMessage(data.error || "Brand not found.");
            return;
        }

        brandIdInput.value = data.brand_id;
        brandNameInput.value = data.brand_name;

        brandModalTitle.textContent = "Edit Brand";

        brandModal.show();
    } catch (error) {
        setMessage("Unable to load brand.");
        console.error(error);
    }

}

/**
 * Deletes a brand by identifier after confirmation.
 *
 * @param {number} id - The brand identifier.
 * @returns {Promise<void>} A promise resolved when deletion is processed.
 */
async function deleteBrand(id) {

    if (!confirm("Delete this brand ?")) return;

    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/brands/${id}`, {
            method: "DELETE",
            headers: { "X-API-KEY": API_KEY }
        });

        if (!response.ok) {
            setMessage(data.error || "Delete failed.");
            return;
        }

        await loadBrands();
        setMessage("Brand deleted successfully.", "success");
    } catch (error) {
        setMessage("Unable to delete brand.");
        console.error(error);
    }

}

prevPageBtn.onclick = () => {

    if (currentPage > 1) {
        currentPage--;
        renderBrands();
    }

};

nextPageBtn.onclick = () => {

    const totalPages = Math.max(1, Math.ceil(getFilteredBrands().length / ITEMS_PER_PAGE));

    if (currentPage < totalPages) {
        currentPage++;
        renderBrands();
    }

};

if (searchNameInput) {
    searchNameInput.addEventListener("input", () => {
        currentPage = 1;
        renderBrands();
    });
}

loadBrands();