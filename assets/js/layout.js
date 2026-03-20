const user = JSON.parse(sessionStorage.getItem("user"));

if (!user) {
    window.location.href = "login.html";
}

/**
 * Extracts the page filename from a URL-like value.
 *
 * @param {string | null | undefined} value - The source URL or path.
 * @returns {string} The normalized page filename.
 */
function getPageName(value) {
    if (!value) {
        return "";
    }

    return value
        .split("/")
        .pop()
        .split("?")[0]
        .split("#")[0]
        .trim();
}

/**
 * Marks the active navigation link in the main menu.
 *
 * @param {HTMLElement} menu - The menu element containing links.
 * @param {string} pageName - The current page filename.
 * @returns {void}
 */
function markActiveMenuLink(menu, pageName) {
    const menuLinks = menu.querySelectorAll(".nav-link");

    menuLinks.forEach(link => {
        const linkPage = getPageName(link.getAttribute("href"));
        const isActive = linkPage === pageName;

        link.classList.toggle("active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

/**
 * Marks the user profile link as active when needed.
 *
 * @param {string} pageName - The current page filename.
 * @returns {void}
 */
function markActiveUserLink(pageName) {
    const userLink = document.getElementById("userProfileLink");

    if (!userLink) {
        return;
    }

    const isActive = pageName === "profile.html";
    userLink.classList.toggle("active", isActive);

    if (isActive) {
        userLink.setAttribute("aria-current", "page");
    } else {
        userLink.removeAttribute("aria-current");
    }
}

/**
 * Renders the navigation menu based on the connected user role.
 *
 * @returns {void}
 */
function renderMenu() {

    const menu = document.getElementById("menu");

    let html = `
        <li class="nav-item">
            <a class="nav-link" href="products.html">Products</a>
        </li>

        <li class="nav-item">
            <a class="nav-link" href="brands.html">Brands</a>
        </li>

        <li class="nav-item">
            <a class="nav-link" href="categories.html">Categories</a>
        </li>

        <li class="nav-item">
            <a class="nav-link" href="stocks.html">Stocks</a>
        </li>
    `;

    if (user.employee_role === "chief" || user.employee_role === "it") {

        html += `
        <li class="nav-item">
            <a class="nav-link" href="employees.html">Employees</a>
        </li>
        `;
    }

    if (user.employee_role === "it") {

        html += `
        <li class="nav-item">
            <a class="nav-link" href="stores.html">Stores</a>
        </li>
        `;
    }

    menu.innerHTML = html;

    const currentPage = getPageName(window.location.pathname) || "index.html";
    const preferredPage = currentPage === "index.html" ? "" : currentPage;

    if (currentPage === "index.html") {
        sessionStorage.removeItem("activeMenuPage");
    }

    markActiveMenuLink(menu, preferredPage);
    markActiveUserLink(currentPage);

    menu.addEventListener("click", event => {
        const clickedLink = event.target.closest("a.nav-link");

        if (!clickedLink) {
            return;
        }

        const clickedLinkPage = getPageName(clickedLink.getAttribute("href"));

        sessionStorage.setItem("activeMenuPage", clickedLinkPage);
        markActiveMenuLink(menu, clickedLinkPage);
    });

    document.getElementById("userInfo").innerHTML = `
        <a href="profile.html" id="userProfileLink" class="text-white text-decoration-none">
            ${user.employee_name} (${user.employee_role})
        </a>
    `;

    const userProfileLink = document.getElementById("userProfileLink");

    markActiveUserLink(currentPage);

    if (userProfileLink) {
        userProfileLink.addEventListener("click", () => {
            markActiveUserLink("profile.html");
        });
    }
}

/**
 * Logs out the current user and redirects to login page.
 *
 * @returns {void}
 */
function logout() {
    sessionStorage.removeItem("user");
    window.location.href = "login.html";
}

renderMenu();