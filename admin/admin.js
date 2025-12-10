// ==========================
// ADMIN PANEL CLIENT SCRIPT
// Fully rewritten for Option A
// Works with REST API routes in server.js
// ==========================

const API_BASE = "http://localhost:5000/api";
const token = localStorage.getItem("token");

// Auth headers
function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
    };
}

// ==========================
// FETCH HELPERS
// ==========================

async function apiGET(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: authHeaders(),
    });
    return res.json();
}

async function apiPOST(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    return res.json();
}

async function apiPUT(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    return res.json();
}

async function apiDELETE(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return res.json();
}

// ==========================
// USERS SECTION
// ==========================

async function loadUsers() {
    const users = await apiGET("/users");
    const tbody = document.getElementById("usersTable");
    tbody.innerHTML = "";

    users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${user.user_id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>
                <button onclick="editUser(${user.user_id})">Edit</button>
                <button onclick="removeUser(${user.user_id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function addUser() {
    const username = document.getElementById("newUserName").value;
    const email = document.getElementById("newUserEmail").value;
    const password = document.getElementById("newUserPassword").value;
    const role = document.getElementById("newUserRole").value;

    await apiPOST("/users", { username, email, password, role });
    loadUsers();
}

async function editUser(id) {
    const newName = prompt("New username:");
    const newEmail = prompt("New email:");
    const newRole = prompt("New role (admin/user):");

    await apiPUT(`/users/${id}`, {
        username: newName,
        email: newEmail,
        role: newRole,
    });

    loadUsers();
}

async function removeUser(id) {
    if (!confirm("Delete this user?")) return;
    await apiDELETE(`/users/${id}`);
    loadUsers();
}

// ==========================
// ITEMS SECTION
// ==========================

async function loadItems() {
    const items = await apiGET("/items");
    const tbody = document.getElementById("itemsTable");
    tbody.innerHTML = "";

    items.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.item_id}</td>
            <td>${item.name}</td>
            <td>${item.description}</td>
            <td>${item.price}</td>
            <td>${item.stock}</td>
            <td>${item.category_name || "None"}</td>
            <td>
                <button onclick="editItem(${item.item_id})">Edit</button>
                <button onclick="removeItem(${item.item_id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function addItem() {
    const name = document.getElementById("newItemName").value;
    const description = document.getElementById("newItemDescription").value;
    const price = document.getElementById("newItemPrice").value;
    const stock = document.getElementById("newItemStock").value;
    const category_id = document.getElementById("newItemCategory").value;

    await apiPOST("/items", {
        name,
        description,
        price,
        stock,
        category_id,
    });

    loadItems();
}

async function editItem(id) {
    const newName = prompt("New name:");
    const newDesc = prompt("New description:");
    const newPrice = prompt("New price:");
    const newStock = prompt("New stock:");

    await apiPUT(`/items/${id}`, {
        name: newName,
        description: newDesc,
        price: newPrice,
        stock: newStock,
    });

    loadItems();
}

async function removeItem(id) {
    if (!confirm("Delete this item?")) return;
    await apiDELETE(`/items/${id}`);
    loadItems();
}

// ==========================
// CATEGORIES SECTION
// ==========================

async function loadCategories() {
    const categories = await apiGET("/categories");
    const tbody = document.getElementById("categoriesTable");
    tbody.innerHTML = "";

    categories.forEach(cat => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${cat.category_id}</td>
            <td>${cat.name}</td>
        `;
        tbody.appendChild(row);
    });
}

// ==========================
// ORDERS SECTION
// ==========================

async function loadOrders() {
    const orders = await apiGET("/orders");
    const tbody = document.getElementById("ordersTable");
    tbody.innerHTML = "";

    orders.forEach(order => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${order.order_id}</td>
            <td>${order.username}</td>
            <td>${order.email}</td>
            <td>${order.total_amount}</td>
            <td>${order.status}</td>
            <td>${order.item_count}</td>
        `;
        tbody.appendChild(row);
    });
}

// ==========================
// INITIAL LOAD
// ==========================

window.onload = () => {
    loadUsers();
    loadItems();
    loadCategories();
    loadOrders();
};
