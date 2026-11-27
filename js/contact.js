// Fetch Form and Message Elements
let contactForm = document.getElementById("contact-form");
let userName = document.getElementById("your-name");
let userEmail = document.getElementById("your-email");
let userSubject = document.getElementById("your-subject");
let userMessage = document.getElementById("your-message");
let errMessage = document.getElementById("message");
let sentMessages = document.getElementById("sent-messages");

// Load stored data when document body is loaded
document.body.onload = function() { displayStoredData(); userName.focus(); };

// Execute function when form is submitted
contactForm.addEventListener('submit', function(event) {

    // Prevent the default browser refresh behavior and clearing form values 
    event.preventDefault();

    // Set Error Message container text and background colours
    errMessage.style.color = "white";
    errMessage.style.backgroundColor = "purple";

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
    errMessage.textContent = "Message sent! Please see Message Queue below.";
    errMessage.style.color = "white";
    errMessage.style.backgroundColor = "green";
    //sentMessages.style.display = "block";
    //sentMessages.style.backgroundColor = "white";
    //sentMessages.textContent = userName.value + " : " + userEmail.value + " : " + userSubject.value + " : " + userMessage.value;

    let data = JSON.parse(localStorage.getItem("sentMessages")) || [];
    data.push({name:userName.value,email:userEmail.value,subject:userSubject.value,message:userMessage.value});
    // Save to localStorage
    localStorage.setItem("sentMessages", JSON.stringify(data));
    // Call function to display messages
    displayStoredData();

    //contactForm.action = "";
    //contactForm.method = "POST"; 
    contactForm.reset();
    //contactForm.submit();

});


function displayStoredData() {
    // Retrieve and parse data
    let data = JSON.parse(localStorage.getItem("sentMessages"));
   
    if (data != null) {
    let messageText = "<h2>Sent Messages</h2>";
    messageText += "<table id='message-table'><thead><tr><td> <b>#</b> </td><td> <b>Name</b> </td><td> <b>Email</b> </td><td> <b>Subject</b> </td><td> <b>Message</b> </td></tr></thead><tbody>";
    // Looping through the array
    for (let i = 0; i < data.length; i++) {
        messageText += "<tr><td>" + (i+1) + "</td><td>" + data[i].name + " </td><td>" + data[i].email + " </td><td>" + data[i].subject + " </td><td>" + data[i].message + "</td></tr>";
    }

    messageText += "</tbody></table> <br /><br />";
    messageText += "<button onclick='deleteMessages();'>Delete Sent Messages</button> <br /><br />";
    sentMessages.innerHTML = messageText;
    //document.getElementById("message-table").style.border = "1px solid #333";
    //document.getElementById("message-table").style.borderCollapse = "collapse";
    document.getElementById("message-table").style.maxWidth = "50vw";
    sentMessages.style.display = "block";
    sentMessages.style.color = "white";
    //sentMessages.style.backgroundColor = "#edeaea";
    //sentMessages.style.border = "3px solid #333";
    //sentMessages.classList.add("about-card");
   }
};


function deleteMessages() {
    localStorage.clear();
    window.location.reload();
};