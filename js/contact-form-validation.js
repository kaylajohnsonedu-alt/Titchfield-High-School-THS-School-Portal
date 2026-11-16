// Fetch Form and Message Elements
let contactForm = document.getElementById("contact-form");
let userName = document.getElementById("your-name");
let userEmail = document.getElementById("your-email");
let userSubject = document.getElementById("your-subject");
let userMessage = document.getElementById("your-message");
let errMessage = document.getElementById("message");

contactForm.addEventListener('submit', function(event) {

    // Prevent the default browser refresh behavior and clearing form values 
    event.preventDefault();

    let namePattern = /^[a-zA-Z'-]+(?: [a-zA-Z'-]+)*$/;
    if (namePattern.test(userName.value)) {
        errMessage.style.display = "none";
    } else {
        errMessage.style.display = "block";
        errMessage.textContent = "Please enter a valid name! Blank spaces and Numbers are NOT accepted!";
        userName.focus();
        return;
    }

    let emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (emailPattern.test(userEmail.value)) {
        errMessage.style.display = "none";
    } else {
        errMessage.style.display = "block";
        errMessage.textContent = "Please enter a valid email address!";
        userEmail.focus();
        return;
    }

    if (userSubject.value.trim().length < 10) {
        errMessage.style.display = "block";
        errMessage.textContent = "Subject must be at least 10 characters long!";
        userSubject.focus();
        return;
    }

    if (userMessage.value.trim().length < 20) {
        errMessage.style.display = "block";
        errMessage.textContent = "Message must be at least 20 characters long!";
        userMessage.focus();
        return;
    }


    errMessage.style.display = "block";
    errMessage.textContent = userName.value + " : " + userEmail.value + " : " + userSubject.value + " : " + userMessage.value;
    //contactForm.action = "ticket.html";
    //contactForm.method = "POST"; 
    //contactForm.submit();

});