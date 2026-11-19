/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm 
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm
*/


// LOGIN
// Retrieves the login form using its unique ID
const loginForm = document.getElementById("loginForm");

// Checks whether the login form exists on the current webpage
if (loginForm) {

    // Adds an event listener that waits for the form to be submitted
    loginForm.addEventListener("submit", function (e) {

        // Prevents the browser from refreshing the page when the form is submitted
        e.preventDefault();

        // Retrieves the username entered by the user and removes whitespace
        const username = document.getElementById("username").value.trim();

        // Retrieves the password entered by the user and removes whitespace
        const password = document.getElementById("password").value.trim();

        // Retrieves the selected role from the dropdown menu
        const role = document.getElementById("role").value;

        // Creates an array containing the predefined user accounts
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

        // Searches the users array for an account matching all three credentials
        const validUser = users.find(user =>
            user.username === username &&
            user.password === password &&
            user.role === role
        );

        // Checks whether a matching user account was found
        if (validUser) {

            // Stores the login status in local storage
            localStorage.setItem("isLoggedIn", "true");

            // Stores the username of the authenticated user
            localStorage.setItem("username", validUser.username);

            // Stores the role of the authenticated user
            localStorage.setItem("role", validUser.role);

            // Checks whether the authenticated user is an administrator
            if (validUser.role === "administrator") {

                // Redirects the administrator to the admin dashboard
                window.location.href = "admin.html";

            } else {

                // Redirects the teacher to the teacher dashboard
                window.location.href = "teacher.html";
            }

        } else {

            // Displays an error message if the credentials do not match
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