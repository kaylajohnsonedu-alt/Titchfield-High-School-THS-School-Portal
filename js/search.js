/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    Jamelia Freeman - Finance and Reporting
    search.js: searches students by ID or name (with grade and status filters) and shows one student's
    profile, financial statement, transactions and grades. Everything on this page is read-only.
    Needs finance-common.js to be loaded first.
*/

//collect the search controls and output elements
const studentSearchForm = document.getElementById("studentSearchForm");
const studentIdInput = document.getElementById("search-input");
const searchGradeFilter = document.getElementById("searchGradeFilter");
const searchStatusFilter = document.getElementById("searchStatusFilter");
const searchResultsBody = document.getElementById("searchResults");
const studentProfile = document.getElementById("studentProfile");
const studentDetails = document.getElementById("studentDetails");
const transactionTableBody = document.getElementById("tranHistory");
const gradesTableBody = document.getElementById("gradesBody");
const searchMessage = document.getElementById("searchMessage");
const printStatementButton = document.getElementById("printStatement");

//show one line of text inside a table body (used for "no results" style messages)
function setTableMessage(tableBody, columnCount, message) {
  tableBody.textContent = "";
  const row = tableBody.insertRow();
  const cell = row.insertCell();
  cell.colSpan = columnCount;
  cell.textContent = message;
}

//hide the profile, transactions and grades until a student is chosen
function clearStudentDetails() {
  studentProfile.hidden = true;
  studentDetails.hidden = true;
  transactionTableBody.textContent = "";
  gradesTableBody.textContent = "";
}

//put text into a profile card element (a dash is shown when the student has no value saved)
function setCardText(elementId, value) {
  document.getElementById(elementId).textContent = value === "" || value == null ? "-" : String(value);
}

//fill the profile card, financial statement, transaction table and grades table for one student
function showStudentDetails(student) {
  const transactions = loadList(historyStorageKey);
  const summary = buildStudentSummary(student, transactions, getTodayText());

  //personal details (field names are matched by normalizeStudent in finance-common.js)
  setCardText("studentProfileId", student.stuId);
  setCardText("studentProfileFirstName", student.fname);
  setCardText("studentProfileLastName", student.lname);
  setCardText("cardAddress", student.address);
  setCardText("cardEmail", student.email);
  setCardText("cardDOB", student.dob);
  setCardText("cardGrade", student.grade);
  setCardText("cardPrevSchool", student.prevSchool);
  setCardText("cardPGName", student.parentName);
  setCardText("cardPGContact", student.parentContact);

  //financial statement
  setCardText("cardTuition", summary.tuitionAmt.toFixed(2));
  setCardText("cardPaid", summary.amtPaid.toFixed(2));
  setCardText("cardDue", summary.amtDue.toFixed(2));
  const statusCell = document.getElementById("cardStatus");
  statusCell.textContent = "";
  statusCell.appendChild(createStatusBadge(summary.status));

  studentProfile.hidden = false;
  studentDetails.hidden = false;

  //transactions made by this student
  transactionTableBody.textContent = "";
  const matchingTransactions = transactions.filter((transaction) =>
    String(transaction.stuId).trim().toLowerCase() === student.stuId.toLowerCase()
  );

  matchingTransactions.forEach((transaction) => {
    const row = transactionTableBody.insertRow();
    [
      transaction.stuId,
      transaction.tranNum,
      transaction.tranAmt,
      transaction.tranDate,
      transaction.tranType,
    ].forEach((value) => {
      row.insertCell().textContent = value == null ? "" : String(value);
    });
  });

  if (matchingTransactions.length === 0) {
    setTableMessage(transactionTableBody, 5, "No transactions found for this student.");
  }

  //grades saved by the teacher pages (sp_grades uses studentId, subjectCode, semester, assessment, score and maxScore)
  gradesTableBody.textContent = "";
  const studentGrades = loadList(gradesStorageKey).filter((grade) =>
    grade && String(grade.studentId).trim().toLowerCase() === student.stuId.toLowerCase()
  );

  studentGrades.forEach((grade) => {
    const row = gradesTableBody.insertRow();
    [
      grade.subjectCode,
      grade.semester,
      grade.assessment,
      grade.score + " / " + grade.maxScore,
    ].forEach((value) => {
      row.insertCell().textContent = value == null ? "" : String(value);
    });
  });

  if (studentGrades.length === 0) {
    setTableMessage(gradesTableBody, 4, "No grades have been recorded for this student.");
  }

  searchMessage.textContent =
    `${matchingTransactions.length} transaction${matchingTransactions.length === 1 ? "" : "s"} found for ${student.stuId}.`;
}

//search students by id or name and apply the grade and status filters
function searchStudents(event) {
  event.preventDefault();
  clearStudentDetails();

  const query = studentIdInput.value.trim().toLowerCase();
  const gradeValue = searchGradeFilter.value;
  const statusValue = searchStatusFilter.value;

  //ask for something to search with when the box and both filters are empty
  if (!query && !gradeValue && !statusValue) {
    setTableMessage(searchResultsBody, 6, "Enter a student ID or name, or choose a filter.");
    searchMessage.textContent = "Enter a student ID or name to view their details.";
    return;
  }

  const students = loadStudents();
  if (students.length === 0) {
    setTableMessage(searchResultsBody, 6, "No student records could be loaded from this browser.");
    searchMessage.textContent = "No student records could be loaded from this browser.";
    return;
  }

  const transactions = loadList(historyStorageKey);
  const todayText = getTodayText();

  //keep students whose id or name contains the search text and who match both filters
  const matches = students
    .map((student) => ({ student, summary: buildStudentSummary(student, transactions, todayText) }))
    .filter(({ student, summary }) => {
      const searchable = `${student.stuId} ${student.fname} ${student.lname}`.toLowerCase();
      return searchable.includes(query) &&
        (gradeValue === "" || student.grade === gradeValue) &&
        (statusValue === "" || summary.status === statusValue);
    });

  searchResultsBody.textContent = "";

  matches.forEach(({ student, summary }) => {
    const row = searchResultsBody.insertRow();
    [
      student.stuId,
      `${student.fname} ${student.lname}`.trim(),
      student.grade,
      summary.amtDue.toFixed(2),
    ].forEach((value) => { row.insertCell().textContent = value; });
    row.insertCell().appendChild(createStatusBadge(summary.status));

    //each row gets a button that opens that student's full details
    const actionCell = row.insertCell();
    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.className = "view-student";
    viewButton.dataset.stuId = student.stuId;
    viewButton.textContent = "View";
    actionCell.appendChild(viewButton);
  });

  if (matches.length === 0) {
    setTableMessage(searchResultsBody, 6, "No students match your search. Try a different ID or name.");
    searchMessage.textContent = "No students match your search.";
    return;
  }

  searchMessage.textContent = `${matches.length} student${matches.length === 1 ? "" : "s"} found.`;

  //open the details straight away when only one student matches
  if (matches.length === 1) {
    showStudentDetails(matches[0].student);
  }
}

//open a student's details when their View button is clicked
searchResultsBody.addEventListener("click", (event) => {
  const viewButton = event.target.closest(".view-student");
  if (!viewButton) return;

  const student = loadStudents().find((s) => s.stuId === viewButton.dataset.stuId);
  if (student) {
    showStudentDetails(student);
    studentProfile.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

//open the browser's print window so the statement can be printed or saved as a pdf
if (printStatementButton) {
  printStatementButton.addEventListener("click", () => window.print());
}

studentSearchForm.addEventListener("submit", searchStudents);
