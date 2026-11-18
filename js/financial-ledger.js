const DEFAULT_DUE_DATE = "2026-12-01";
        


const TUITION_BY_GRADE = {
  "7": 70000, "8": 70000, "9": 75000 , "10": 83000, "11": 85000, "12": 90000, "13": 90000 
};
const transactionDate = document.getElementById("tranDate");

if (transactionDate) {
  const today = new Date();
  transactionDate.max = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

const historyStorageKey = "transactionHistory";
const studentStorageKey = "titchfieldStudent";
const historyTableBody = document.getElementById("tranHistory");
const sampleStudents = [
  { stuId: "TEST001", fname: "Ava", lname: "Morgan", grade: "7" },
  { stuId: "TEST002", fname: "Noah", lname: "Campbell", grade: "9" },
  { stuId: "TEST003", fname: "Mia", lname: "Williams", grade: "12" },
];
const sampleTransactions = [
  { stuId: "TEST001", tranNum: "900000000001", tranAmt: "25000", tranDate: "2026-01-15", tranType: "Cash" },
  { stuId: "TEST002", tranNum: "900000000002", tranAmt: "75000", tranDate: "2026-02-20", tranType: "ATM / Counter" },
  { stuId: "TEST003", tranNum: "900000000003", tranAmt: "90000", tranDate: "2026-03-10", tranType: "Mobile Transfer" },
];

function studentIdExists(studentData, studentId) {
  const matchesStudentId = (student) =>
    student &&
    typeof student === "object" &&
    [student.stuId, student.studentId, student.id].some(
      (id) => String(id ?? "").trim() === studentId
    );

  if (Array.isArray(studentData)) {
    return studentData.some(matchesStudentId);
  }

  if (!studentData || typeof studentData !== "object") {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(studentData, studentId)) {
    return true;
  }

  if (matchesStudentId(studentData)) {
    return true;
  }

  const students = Array.isArray(studentData.students) ? studentData.students : Object.values(studentData);
  return students.some(matchesStudentId);
}

if (historyTableBody) {
  try {
    const transactions = JSON.parse(localStorage.getItem(historyStorageKey) || "[]");
    transactions.forEach((transaction, index) => {
      const row = historyTableBody.insertRow();
      [
        transaction.stuId,
        transaction.tranNum,
        transaction.tranAmt,
        transaction.tranDate,
        transaction.tranType,
      ].forEach((value) => {
        row.insertCell().textContent = value;
      });

      const deleteCell = row.insertCell();
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-transaction";
      deleteButton.dataset.transactionIndex = index;
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete transaction ${transaction.tranNum}`);
      deleteCell.appendChild(deleteButton);
    });
  } catch (error) {
    console.error("Could not load transaction history.", error);
    alert("Transaction history could not be loaded from this browser.");
  }

  historyTableBody.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".delete-transaction");
    if (!deleteButton || !historyTableBody.contains(deleteButton)) {
      return;
    }

    const transactionIndex = Number(deleteButton.dataset.transactionIndex);
    try {
      const transactions = JSON.parse(localStorage.getItem(historyStorageKey) || "[]");
      if (!Number.isInteger(transactionIndex) || transactionIndex < 0 || transactionIndex >= transactions.length) {
        throw new Error("The selected transaction no longer exists.");
      }

      transactions.splice(transactionIndex, 1);
      localStorage.setItem(historyStorageKey, JSON.stringify(transactions));
      window.location.reload();
    } catch (error) {
      console.error("Could not delete transaction.", error);
      alert("Transaction could not be deleted. Please check browser storage settings and try again.");
    }
  });
}

const historyForm = document.getElementById("ledgerInputs");

if (historyForm) {
  historyForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const transaction = {
      stuId: document.getElementById("stuId").value.trim(),
      tranNum: document.getElementById("tranNum").value,
      tranAmt: document.getElementById("tranAmt").value,
      tranDate: document.getElementById("tranDate").value,
      tranType: document.getElementById("tranType").value,
    };

    let studentData;
    try {
      const savedStudentData = localStorage.getItem(studentStorageKey);
      if (savedStudentData === null) {
        throw new Error(`No student records found under "${studentStorageKey}".`);
      }

      studentData = JSON.parse(savedStudentData);
      if (!studentData || typeof studentData !== "object") {
        throw new Error("Student records have an invalid format.");
      }
    } catch (error) {
      console.error("Could not verify student ID.", error);
      alert("Student records could not be verified. Please try again later.");
      return;
    }

    if (!studentIdExists(studentData, transaction.stuId)) {
      alert("Student ID not found. Please enter a valid student ID.");
      return;
    }

    const amount = Number(transaction.tranAmt);
    if (amount <= 0) {
      alert("Transaction amount must be greater than 0.");
      return;
    }

    const student = loadList(studentStorageKey).find((s) => String(s.stuId) === transaction.stuId);
    if (student) {
      const tuitionAmt = TUITION_BY_GRADE[student.grade] || 0;
      const balance = Math.round((tuitionAmt - calculatePaid(student.stuId, loadList(historyStorageKey))) * 100) / 100;
      if (amount > balance) {
        alert("Payment is more than the outstanding balance of " + balance.toFixed(2) + ".");
        return;
      }
    }

    try {
    const transactions = JSON.parse(localStorage.getItem(historyStorageKey) || "[]");

    const isDuplicate = transactions.some((t) => t.tranNum === transaction.tranNum);
    if (isDuplicate) {
      alert("Transaction already exists.");
      return;
    }

    transactions.push(transaction);
    localStorage.setItem(historyStorageKey, JSON.stringify(transactions));
    window.location.href = "TranHistory.html";
    } catch (error) {
      console.error("Could not save transaction.", error);
      alert("Transaction could not be saved.");
    }
  });
}
function loadList(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(saved) ? saved : [saved];
  } catch (error) {
    console.error("Could not load " + key, error);
    return [];
  }
}

function calculatePaid(stuId, transactions) {
  let total = 0;
  transactions.forEach((t) => {
    if (String(t.stuId) === String(stuId)) {
      total += Number(t.tranAmt);
    }
  });
  return total;
}

function getAccountStatus(amtDue, dueDate, todayText) {
  if (amtDue <= 0) return "Paid";
  return todayText > dueDate ? "Outstanding" : "Pending";
}

function renderLedger(searchText = "") {
  const body = document.getElementById("ledger-entries");
  if (!body) return;
  body.textContent = "";
  const students = loadList(studentStorageKey);
  const transactions = loadList(historyStorageKey);
  const todayText = new Date().toISOString().slice(0, 10);
  const query = searchText.trim();
  let totalExpected = 0;
  let totalCollected = 0;
  let rowsShown = 0;

  students.forEach((student) => {
    const tuitionAmt = TUITION_BY_GRADE[student.grade] || 0;
    const amtPaid = calculatePaid(student.stuId, transactions);
    const amtDue = Math.round((tuitionAmt - amtPaid) * 100) / 100;
    totalExpected += tuitionAmt;
    totalCollected += amtPaid;

    if (!String(student.stuId).toLowerCase().includes(query.toLowerCase())) return;

    rowsShown++;
    const row = body.insertRow();
    [
      student.stuId,
      student.fname,
      student.lname,
      tuitionAmt.toFixed(2),
      amtPaid.toFixed(2),
      amtDue.toFixed(2),
      getAccountStatus(amtDue, DEFAULT_DUE_DATE, todayText),
    ].forEach((value) => { row.insertCell().textContent = value; });
  });

  if (rowsShown === 0) {
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 7;
    cell.textContent = "No students found.";
  }

  document.getElementById("expectedFees").textContent = totalExpected.toFixed(2);
  document.getElementById("collectedFees").textContent = totalCollected.toFixed(2);
  document.getElementById("outstandingFees").textContent = (totalExpected - totalCollected).toFixed(2);
  document.getElementById("studentCount").textContent = students.length;
}

const searchInput = document.getElementById("search-input");
const searchButton = document.querySelector(".search-bar button");
const loadSampleDataButton = document.getElementById("loadSampleData");

if (searchInput && searchButton) {
  searchInput.addEventListener("input", () => renderLedger(searchInput.value));
  searchButton.addEventListener("click", () => renderLedger(searchInput.value));
}

if (loadSampleDataButton) {
  loadSampleDataButton.addEventListener("click", () => {
    try {
      const students = loadList(studentStorageKey);
      const transactions = loadList(historyStorageKey);
      const sampleStudentIds = new Set(sampleStudents.map((student) => student.stuId));
      const sampleTransactionNumbers = new Set(sampleTransactions.map((transaction) => transaction.tranNum));
      const hasStudentConflict = students.some((student) => sampleStudentIds.has(String(student.stuId)));
      const hasTransactionConflict = transactions.some((transaction) =>
        sampleTransactionNumbers.has(String(transaction.tranNum))
      );

      if (hasStudentConflict || hasTransactionConflict) {
        alert("Sample data was not loaded because one or more sample IDs already exist. Remove the conflicting records and try again.");
        return;
      }

      localStorage.setItem(studentStorageKey, JSON.stringify([...students, ...sampleStudents]));
      localStorage.setItem(historyStorageKey, JSON.stringify([...transactions, ...sampleTransactions]));
      renderLedger(searchInput ? searchInput.value : "");
      alert("Sample students and transactions were added.");
    } catch (error) {
      console.error("Could not load sample data.", error);
      alert("Sample data could not be loaded. Please check browser storage settings and try again.");
    }
  });
}

renderLedger();