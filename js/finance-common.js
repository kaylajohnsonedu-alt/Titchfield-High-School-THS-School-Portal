/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    Jamelia Freeman - Finance and Reporting
    finance-common.js: shared helpers used by the ledger, query wizard, reports and transaction pages.
    Load this file BEFORE the page's own script on every finance page.
*/

//default due date and tuition amounts (dates are kept as text so they can be compared without date maths)
const DEFAULT_DUE_DATE = "2026-12-01";

const TUITION_BY_GRADE = {
  "7": 70000, "8": 70000, "9": 75000 , "10": 83000, "11": 85000, "12": 90000, "13": 90000 
};

//storage keys: transactions belong to Student 5, student records are written by Student 3
const historyStorageKey = "transactionHistory";
const gradesStorageKey = "sp_grades";
const defaultStudentStorageKey = "sp_students";

//student records are looked up under each of these keys, in this order, until one has records
const studentStorageKeys = ["sp_students", "titchfieldStudent", "titchfieldStudents"];

//load a list from localStorage (returns an empty array if it is missing or broken)
function loadList(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(saved) ? saved : [saved];
  } catch (error) {
    console.error("Could not load " + key, error);
    return [];
  }
}

//save a list to localStorage (returns true if it worked)
function saveList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch (error) {
    console.error("Could not save " + key, error);
    return false;
  }
}

//get today's date as yyyy-mm-dd using the local time (toISOString uses UTC and can be a day ahead in Jamaica)
function getTodayText() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

//return the first value in a record that is not empty, checking each possible field name in order
function pickValue(record, fieldNames) {
  for (const name of fieldNames) {
    const value = record[name];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

//turn a grade such as 9, "9" or "Grade 9" into just its number text ("9")
function getGradeNumber(value) {
  const match = String(value ?? "").match(/\d+/);
  return match ? match[0] : "";
}

//make every student record look the same, whichever field names Student 3 or Student 4 used
function normalizeStudent(record) {
  const parentFirst = pickValue(record, ["PGname", "parentFirstName"]);
  const parentLast = pickValue(record, ["PGlname", "PGLname", "parentLastName"]);
  return {
    stuId: pickValue(record, ["stuId", "studentId", "id"]),
    fname: pickValue(record, ["fname", "firstName"]),
    lname: pickValue(record, ["lname", "lastName"]),
    grade: getGradeNumber(pickValue(record, ["grade", "gradelvl", "gradeLevel", "formLevel"])),
    address: pickValue(record, ["address", "adress"]),
    email: pickValue(record, ["email", "emailL"]),
    dob: pickValue(record, ["DOB", "dob"]),
    prevSchool: pickValue(record, ["PrevSchool", "prevSchool"]),
    parentName: pickValue(record, ["parentName"]) || (parentFirst + " " + parentLast).trim(),
    parentContact: pickValue(record, ["PGcontact", "guardianPhone", "parentContact"]),
  };
}

//read the raw student records saved under one key (supports arrays, {students: []}, one object, or keyed objects)
function readStudentRecords(key) {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return [];

    const records = JSON.parse(stored);
    if (Array.isArray(records)) return records;
    if (!records || typeof records !== "object") return [];
    if (Array.isArray(records.students)) return records.students;
    if (records.stuId || records.studentId || records.id) return [records];

    return Object.values(records).filter((record) => record && typeof record === "object");
  } catch (error) {
    console.error("Could not load student records from " + key, error);
    return [];
  }
}

//find which key currently holds the student records (falls back to the default key when none do)
function getStudentStorageKey() {
  for (const key of studentStorageKeys) {
    if (readStudentRecords(key).length > 0) return key;
  }
  return defaultStudentStorageKey;
}

//load every student as a normalized record, skipping any record without an id
function loadStudents() {
  return readStudentRecords(getStudentStorageKey())
    .filter((record) => record && typeof record === "object")
    .map(normalizeStudent)
    .filter((student) => student.stuId !== "");
}

//add up every payment made by one student (ids are compared ignoring upper and lower case)
function calculatePaid(stuId, transactions) {
  let total = 0;
  transactions.forEach((t) => {
    if (String(t.stuId).trim().toLowerCase() === String(stuId).trim().toLowerCase()) {
      const amount = Number(t.tranAmt);
      if (Number.isFinite(amount) && amount > 0) total += amount;
    }
  });
  return Math.round(total * 100) / 100;
}

//work out the account status (a grade with no tuition set is flagged instead of being marked as paid)
function getAccountStatus(amtDue, tuitionAmt, dueDate, todayText) {
  if (tuitionAmt <= 0) return "No fee set"; //an unknown grade would otherwise show a zero balance and look paid
  if (amtDue <= 0) return "Paid"; //mark balances at zero or below as paid
  return todayText > dueDate ? "Outstanding" : "Pending";
}

//calculate tuition, payments, balance and status for one student
function buildStudentSummary(student, transactions, todayText) {
  const tuitionAmt = TUITION_BY_GRADE[student.grade] || 0;
  const amtPaid = calculatePaid(student.stuId, transactions);
  const remaining = Math.round((tuitionAmt - amtPaid) * 100) / 100;
  const amtDue = remaining > 0 ? remaining : 0;
  return {
    tuitionAmt,
    amtPaid,
    amtDue,
    status: getAccountStatus(amtDue, tuitionAmt, DEFAULT_DUE_DATE, todayText),
  };
}

//create a coloured status badge (the css class comes from the status text, e.g. "No fee set" becomes status-no-fee-set)
function createStatusBadge(status) {
  const badge = document.createElement("span");
  badge.className = "status-badge status-" + status.toLowerCase().replace(/\s+/g, "-");
  badge.textContent = status;
  return badge;
}

//keep role compatibility for sites that set localStorage session values, without redirecting.
//when no role has been saved, the standalone Live Server version is treated as administrator.
function getCurrentRole() {
  if (localStorage.getItem("isLoggedIn") === "false") return "";
  return (localStorage.getItem("role") || "administrator").toLowerCase();
}

//only the saved administrator role may add or delete financial records
function isFinanceAdmin() {
  return getCurrentRole() === "administrator";
}

function applyReadOnlyMode() {
  if (isFinanceAdmin()) return;
  document.querySelectorAll(".admin-only").forEach((element) => {
    element.hidden = true;
  });
}

applyReadOnlyMode();
