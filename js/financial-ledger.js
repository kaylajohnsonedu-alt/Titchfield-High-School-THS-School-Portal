/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    Jamelia Freeman - Finance and Reporting
    financial-ledger.js: adds payments and shows each student's balance and status.
    Needs finance-common.js to be loaded first.
*/

//stop the date picker from allowing a future transaction date
const transactionDate = document.getElementById("tranDate");

if (transactionDate) {
  transactionDate.max = getTodayText(); //prevent entering a future transaction date
}

//page elements used by the ledger
const historyForm = document.getElementById("ledgerInputs");
const searchInput = document.getElementById("search-input");
const searchButton = document.querySelector(".search-bar button");

//remember each student's last status so a row can flash when its status changes
let previousStatuses = {};

if (historyForm) {
  //validate and save a submitted transaction
  historyForm.addEventListener("submit", (event) => {
    event.preventDefault();

    //only the administrator may add transactions
    if (!isFinanceAdmin()) {
      alert("Only an administrator can add transactions.");
      return;
    }

    const transaction = {
      stuId: document.getElementById("stuId").value.trim(),
      tranNum: document.getElementById("tranNum").value,
      tranAmt: document.getElementById("tranAmt").value,
      tranDate: document.getElementById("tranDate").value,
      tranType: document.getElementById("tranType").value,
    };

    //check that student records exist before looking for the student id
    const students = loadStudents();
    if (students.length === 0) {
      alert("Student records could not be verified. Please register a student first.");
      return;
    }

    //find the student (upper and lower case are ignored)
    const student = students.find((s) => s.stuId.toLowerCase() === transaction.stuId.toLowerCase());
    if (!student) {
      alert("Student ID not found. Please enter a valid student ID.");
      return;
    }
    transaction.stuId = student.stuId; //save the id exactly as it is stored so payments always match the student

    const amount = Number(transaction.tranAmt);
    if (!(amount > 0)) {
      alert("Transaction amount must be greater than 0.");
      return;
    }
    if (!transaction.tranDate || transaction.tranDate > getTodayText()) {
      alert("Transaction date cannot be in the future.");
      return;
    }

    //load the saved transactions once and use them for every check below
    const transactions = loadList(historyStorageKey);

    //block payments for a grade with no tuition set (otherwise the overpayment check would be skipped)
    const summary = buildStudentSummary(student, transactions, getTodayText());
    if (summary.tuitionAmt <= 0) {
      alert("No tuition fee is set for this student's grade, so a payment cannot be added.");
      return;
    }

    if (amount > summary.amtDue) {
      alert("Payment is more than the outstanding balance of " + summary.amtDue.toFixed(2) + ".");
      return;
    }

    const isDuplicate = transactions.some((t) => t.tranNum === transaction.tranNum);
    if (isDuplicate) {
      alert("Transaction already exists.");
      return;
    }

    transactions.push(transaction);
    if (!saveList(historyStorageKey, transactions)) { //persist the new transaction
      alert("Transaction could not be saved.");
      return;
    }

    historyForm.reset();
    renderLedger(searchInput ? searchInput.value : "");
    alert("Transaction added successfully.");
  });
}

//render filtered student balances and update the summary cards
function renderLedger(searchText = "") {
  const body = document.getElementById("ledger-entries");
  if (!body) return;
  body.textContent = "";
  const students = loadStudents();
  const transactions = loadList(historyStorageKey);
  const todayText = getTodayText();
  const query = searchText.trim().toLowerCase();
  const newStatuses = {};
  let totalExpected = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let rowsShown = 0;

  students.forEach((student) => {
    const summary = buildStudentSummary(student, transactions, todayText);
    totalExpected += summary.tuitionAmt;
    totalCollected += summary.amtPaid;
    totalOutstanding += summary.amtDue;
    newStatuses[student.stuId] = summary.status;

    if (!student.stuId.toLowerCase().includes(query)) return;

    rowsShown++;
    const row = body.insertRow();
    [
      student.stuId,
      student.fname,
      student.lname,
      summary.tuitionAmt.toFixed(2),
      summary.amtPaid.toFixed(2),
      summary.amtDue.toFixed(2),
    ].forEach((value) => { row.insertCell().textContent = value; });
    row.insertCell().appendChild(createStatusBadge(summary.status)); //coloured status badge

    //flash the row when the student's status has changed since the last time the ledger was drawn
    if (previousStatuses[student.stuId] && previousStatuses[student.stuId] !== summary.status) {
      row.classList.add("row-flash");
    }
  });

  previousStatuses = newStatuses;

  if (rowsShown === 0) {
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 7;
    cell.textContent = "No students found.";
  }

  document.getElementById("expectedFees").textContent = totalExpected.toFixed(2);
  document.getElementById("collectedFees").textContent = totalCollected.toFixed(2);
  document.getElementById("outstandingFees").textContent = totalOutstanding.toFixed(2);
  document.getElementById("studentCount").textContent = students.length;
}

//refresh the ledger as the search query changes
if (searchInput && searchButton) {
  searchInput.addEventListener("input", () => renderLedger(searchInput.value));
  searchButton.addEventListener("click", () => renderLedger(searchInput.value));
}

renderLedger();
