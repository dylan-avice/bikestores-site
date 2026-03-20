const API_BASE_URL = "https://dev-avice231.users.info.unicaen.fr/semestre4/bikestores/bikestores-api";
const API_KEY = "e8f1997c763";
const ITEMS_PER_PAGE = 50;

const currentUser = JSON.parse(sessionStorage.getItem("user"));
const tableBody = document.getElementById("productsTableBody");
const messageBox = document.getElementById("messageBox");

const filterBrand = document.getElementById("filterBrand");
const filterCategory = document.getElementById("filterCategory");
const filterYear = document.getElementById("filterYear");
const filterPriceMin = document.getElementById("filterPriceMin");
const filterPriceMax = document.getElementById("filterPriceMax");
const filterName = document.getElementById("filterName");

const addProductBtn = document.getElementById("addProductBtn");
const productForm = document.getElementById("productForm");

const productIdInput = document.getElementById("productId");
const productNameInput = document.getElementById("productName");
const productBrandInput = document.getElementById("productBrand");
const productCategoryInput = document.getElementById("productCategory");
const productYearInput = document.getElementById("productYear");
const productPriceInput = document.getElementById("productPrice");

const productModalElement = document.getElementById("productModal");
const productModal = new bootstrap.Modal(productModalElement);
const productModalTitle = document.getElementById("productModalTitle");

const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");

let products = [];
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
 * Checks whether the connected user can manage products.
 *
 * @returns {boolean} True when create/update/delete actions are allowed.
 */
function canManageProducts() {
    return ["employee", "chief", "it"].includes(currentUser.employee_role);
}

if (!canManageProducts()) {
    addProductBtn.style.display = "none";
}

/**
 * Fetches data from the API and parses JSON.
 *
 * @param {string} url - The request URL.
 * @param {RequestInit} [options={}] - Fetch options.
 * @returns {Promise<{response: Response, data: any}>} The response and parsed data.
 */
async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
}

/**
 * Loads available brands into filter and form selectors.
 *
 * @returns {Promise<void>} A promise resolved when brands are loaded.
 */
async function loadBrands() {
    const { data } = await fetchJson(`${API_BASE_URL}/brands`);

    filterBrand.innerHTML = `<option value="">All</option>`;
    productBrandInput.innerHTML = "";

    data.forEach(brand => {
        filterBrand.innerHTML += `<option value="${brand.brand_id}">${brand.brand_name}</option>`;
        productBrandInput.innerHTML += `<option value="${brand.brand_id}">${brand.brand_name}</option>`;
    });
}

/**
 * Loads available categories into filter and form selectors.
 *
 * @returns {Promise<void>} A promise resolved when categories are loaded.
 */
async function loadCategories() {
    const { data } = await fetchJson(`${API_BASE_URL}/categories`);

    filterCategory.innerHTML = `<option value="">All</option>`;
    productCategoryInput.innerHTML = "";

    data.forEach(category => {
        filterCategory.innerHTML += `<option value="${category.category_id}">${category.category_name}</option>`;
        productCategoryInput.innerHTML += `<option value="${category.category_id}">${category.category_name}</option>`;
    });
}

/**
 * Builds the products endpoint URL from selected filters.
 *
 * @returns {string} The API URL with optional query parameters.
 */
function buildProductsUrl() {
    const params = new URLSearchParams();

    if (filterBrand.value) params.append("brand_id", filterBrand.value);
    if (filterCategory.value) params.append("category_id", filterCategory.value);
    if (filterYear.value) params.append("model_year", filterYear.value);
    if (filterPriceMin.value) params.append("price_min", filterPriceMin.value);
    if (filterPriceMax.value) params.append("price_max", filterPriceMax.value);

    const queryString = params.toString();
    return queryString ? `${API_BASE_URL}/products?${queryString}` : `${API_BASE_URL}/products`;
}

/**
 * Renders products for the current page.
 *
 * @returns {void}
 */
function renderProducts() {
    const filteredProducts = getFilteredProducts();
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filteredProducts.slice(start, end);

    tableBody.innerHTML = "";

    pageItems.forEach(product => {
        const actionButtons = canManageProducts()
            ? `
                <button class="btn btn-sm btn-warning me-1" onclick="editProduct(${product.product_id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.product_id})">Delete</button>
              `
            : "";

        tableBody.innerHTML += `
            <tr>
                <td>${product.product_id}</td>
                <td>${product.product_name}</td>
                <td>${product.brand_name}</td>
                <td>${product.category_name}</td>
                <td>${product.model_year}</td>
                <td>${product.list_price}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });

    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

/**
 * Returns products filtered by product name.
 *
 * @returns {Array<Object>} The filtered product list.
 */
function getFilteredProducts() {
    let filtered = [...products];
    const nameQuery = filterName.value.trim().toLowerCase();

    if (nameQuery) {
        filtered = filtered.filter(product =>
            String(product.product_name).toLowerCase().includes(nameQuery)
        );
    }

    return filtered;
}

/**
 * Loads products from the API and updates the table.
 *
 * @returns {Promise<void>} A promise resolved when products are rendered.
 */
async function loadProducts() {
    clearMessage();

    try {
        const { data } = await fetchJson(buildProductsUrl());
        products = data;
        currentPage = 1;
        renderProducts();
    } catch (error) {
        setMessage("Unable to load products.");
        console.error(error);
    }
}

/**
 * Resets product form fields to their default values.
 *
 * @returns {void}
 */
function resetForm() {
    productIdInput.value = "";
    productNameInput.value = "";
    productYearInput.value = "";
    productPriceInput.value = "";
}

addProductBtn.addEventListener("click", () => {
    resetForm();
    productModalTitle.textContent = "Add Product";
    productModal.show();
});

/**
 * Handles create/update submission for products.
 *
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>} A promise resolved when save operation ends.
 */
async function handleProductSubmit(event) {
    event.preventDefault();

    const id = productIdInput.value;
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE_URL}/products/${id}` : `${API_BASE_URL}/products`;

    const payload = {
        product_name: productNameInput.value.trim(),
        brand_id: parseInt(productBrandInput.value, 10),
        category_id: parseInt(productCategoryInput.value, 10),
        model_year: parseInt(productYearInput.value, 10),
        list_price: parseFloat(productPriceInput.value)
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

        productModal.hide();
        await loadProducts();
        setMessage(id ? "Product updated successfully." : "Product added successfully.", "success");
    } catch (error) {
        setMessage("Unable to save product.");
        console.error(error);
    }
}

productForm.addEventListener("submit", handleProductSubmit);

/**
 * Loads one product and opens the modal in edit mode.
 *
 * @param {number} id - The product identifier.
 * @returns {Promise<void>} A promise resolved when modal is populated.
 */
async function editProduct(id) {
    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/products/${id}`);

        if (!response.ok) {
            setMessage(data.error || "Product not found.");
            return;
        }

        productIdInput.value = data.product_id;
        productNameInput.value = data.product_name;
        productBrandInput.value = data.brand_id;
        productCategoryInput.value = data.category_id;
        productYearInput.value = data.model_year;
        productPriceInput.value = data.list_price;

        productModalTitle.textContent = "Edit Product";
        productModal.show();
    } catch (error) {
        setMessage("Unable to load product.");
        console.error(error);
    }
}

/**
 * Deletes a product after confirmation.
 *
 * @param {number} id - The product identifier.
 * @returns {Promise<void>} A promise resolved when deletion is processed.
 */
async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) {
        return;
    }

    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/products/${id}`, {
            method: "DELETE",
            headers: {
                "X-API-KEY": API_KEY
            }
        });

        if (!response.ok) {
            setMessage(data.error || "Delete failed.");
            return;
        }

        await loadProducts();
        setMessage("Product deleted successfully.", "success");
    } catch (error) {
        setMessage("Unable to delete product.");
        console.error(error);
    }
}

document.getElementById("applyFiltersBtn").addEventListener("click", () => {
    currentPage = 1;
    loadProducts();
});

document.getElementById("resetFiltersBtn").addEventListener("click", () => {
    filterName.value = "";
    filterBrand.value = "";
    filterCategory.value = "";
    filterYear.value = "";
    filterPriceMin.value = "";
    filterPriceMax.value = "";
    currentPage = 1;
    loadProducts();
});

prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderProducts();
    }
});

nextPageBtn.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(getFilteredProducts().length / ITEMS_PER_PAGE));

    if (currentPage < totalPages) {
        currentPage++;
        renderProducts();
    }
});

filterName.addEventListener("input", () => {
    currentPage = 1;
    renderProducts();
});

loadBrands();
loadCategories();
loadProducts();