// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const role = document.getElementById("role").value;

        const users = [
            {
                username: "admin",
                password: "admin123",
                role: "administrator"
            },
            {
                username: "teacher",
                password: "teacher123",
                role: "teacher"
            }
        ];

        const validUser = users.find(user =>
            user.username === username &&
            user.password === password &&
            user.role === role
        );

        if (validUser) {

            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("username", validUser.username);
            localStorage.setItem("role", validUser.role);

            if (validUser.role === "administrator") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "teacher.html";
            }

        } else {
            document.getElementById("message").textContent =
                "Invalid username, password, or role.";
        }
    });
}

// AUTHENTICATION CHECK
function checkAuth() {
    if (localStorage.getItem("isLoggedIn") !== "true") {
        window.location.href = "login.html";
    }
}

// ADMIN PAGE SECURITY
function checkAdmin() {
    checkAuth();

    if (localStorage.getItem("role") !== "administrator") {
        alert("Access Denied");
        window.location.href = "login.html";
    }
}

// TEACHER PAGE SECURITY
function checkTeacher() {
    checkAuth();

    if (localStorage.getItem("role") !== "teacher") {
        alert("Access Denied");
        window.location.href = "login.html";
    }
}

// LOGOUT
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}