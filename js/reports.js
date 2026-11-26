/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    Jamelia Freeman - Finance and Reporting
    reports.js: filters students by grade and status and shows totals, a status bar chart and a printable table.
    Needs finance-common.js to be loaded first.
*/

//collect report controls and output elements
const gradeFilter = document.getElementById("gradeFilter");
const statusFilter = document.getElementById("statusFilter");
const reportBody = document.getElementById("report-entries");
const reportStatusSummary = document.getElementById("reportStatusSummary");
const statusBars = document.getElementById("statusBars");
const printButton = document.getElementById("printReport");
const reportPrintFilters = document.getElementById("reportPrintFilters");

//every status the report can show (used for the counts and the bars)
const REPORT_STATUSES = ["Paid", "Pending", "Outstanding", "No fee set"];

function getReportRows() {
  //calculate tuition, payments, balances and status for each student
  const students = loadStudents();
  const transactions = loadList(historyStorageKey);
  const todayText = getTodayText();

  return students.map((student) => {
    const summary = buildStudentSummary(student, transactions, todayText);
    return { student, summary };
  });
}

//keep only the rows that match the grade filter
function filterByGrade(allRows) {
  return allRows.filter(({ student }) =>
    gradeFilter.value === "" || student.grade === gradeFilter.value
  );
}

//keep only the rows that match the status filter
function filterByStatus(gradeRows) {
  return gradeRows.filter(({ summary }) =>
    statusFilter.value === "" || summary.status === statusFilter.value
  );
}

function renderStudentRecords() {
  //filter student rows and update the report table
  reportBody.textContent = "";
  const visibleRows = filterByStatus(filterByGrade(getReportRows()));

  visibleRows.forEach(({ student, summary }) => {
    const row = reportBody.insertRow();
    [
      student.stuId,
      student.fname,
      student.lname,
      student.grade,
      summary.tuitionAmt.toFixed(2),
      summary.amtPaid.toFixed(2),
      summary.amtDue.toFixed(2),
    ].forEach((value) => { row.insertCell().textContent = value; });
    row.insertCell().appendChild(createStatusBadge(summary.status)); //coloured status badge
  });

  if (visibleRows.length === 0) {
    const row = reportBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 8;
    cell.textContent = "No students found.";
  }
}

//draw one bar per status using css widths (the width is the share of students in the selected grade)
function renderStatusBars(statusCounts, totalStudents) {
  statusBars.textContent = "";

  REPORT_STATUSES.forEach((status) => {
    const count = statusCounts[status];
    const percent = totalStudents === 0 ? 0 : Math.round((count / totalStudents) * 100);

    const barRow = document.createElement("div");
    barRow.className = "status-bar-row";

    const label = document.createElement("span");
    label.className = "status-bar-label";
    label.textContent = status + " (" + count + ")";

    const track = document.createElement("div");
    track.className = "status-bar-track";

    const fill = document.createElement("div");
    fill.className = "status-bar-fill status-" + status.toLowerCase().replace(/\s+/g, "-");
    fill.style.width = percent + "%";

    track.appendChild(fill);
    barRow.appendChild(label);
    barRow.appendChild(track);
    statusBars.appendChild(barRow);
  });
}

function generateReports() {
  //calculate totals and status counts for the selected grade and status
  const gradeRows = filterByGrade(getReportRows());
  const visibleRows = filterByStatus(gradeRows);
  const totalExpected = visibleRows.reduce((total, { summary }) => total + summary.tuitionAmt, 0); //sum tuition for visible students
  const totalCollected = visibleRows.reduce((total, { summary }) => total + summary.amtPaid, 0); //sum payments for visible students
  const statusCounts = { "Paid": 0, "Pending": 0, "Outstanding": 0, "No fee set": 0 };

  gradeRows.forEach(({ summary }) => { statusCounts[summary.status]++; }); //count each status for the selected grade

  document.getElementById("reExpectedFees").textContent = totalExpected.toFixed(2);
  document.getElementById("reCollectedFees").textContent = totalCollected.toFixed(2);
  const totalOutstanding = visibleRows.reduce((total, { summary }) =>
    total + summary.amtDue, 0);
  document.getElementById("reOutstandingFees").textContent = totalOutstanding.toFixed(2);
  document.getElementById("reStudentCount").textContent = String(visibleRows.length);
  reportStatusSummary.textContent =
    `Status totals for selected grade: Paid ${statusCounts["Paid"]}, Pending ${statusCounts["Pending"]}, Outstanding ${statusCounts["Outstanding"]}, No fee set ${statusCounts["No fee set"]}.`;
  reportPrintFilters.textContent =
    `Filters: Grade: ${gradeFilter.options[gradeFilter.selectedIndex].text}; Status: ${statusFilter.options[statusFilter.selectedIndex].text}`;

  renderStatusBars(statusCounts, gradeRows.length);
}

function updateReports() {
  renderStudentRecords();
  generateReports();
}

//refresh report details whenever a filter changes
gradeFilter.addEventListener("change", updateReports);
statusFilter.addEventListener("change", updateReports);

//open the browser's print window so the report can be printed or saved as a pdf
if (printButton) {
  printButton.addEventListener("click", () => window.print());
}

updateReports();
