/*
 * Members: 1. Mario Creary - 2504252 - Friday 12pm - 2pm
 *          2. Nathan Mannings - 2501919 - Friday 12pm - 2pm
 *          3. Kayla Johnson - 2409453 - Friday 12pm - 2pm
 *          4. Damani Williams - 2007591 - Friday 12pm - 2pm
 *          5. Jamelia Freeman - 2407243 - Friday 12pm - 2pm
 */

// Storage keys shared by the whole team.
const KEY_USERS = "sp_users";
const KEY_TEACHERS = "sp_teachers";
const KEY_SUBJECTS = "sp_subjects";
const KEY_STUDENTS = "sp_students";
const KEY_GRADES = "sp_grades";

const TOTAL_STEPS = 4;
const SEMESTER = "1";

// Remember the teacher's choices as they move through the steps.
let currentStep = 1;
let selectedSubjectCode = "";
let selectedFormLevel = "";
let selectedAssessment = "";


// This function reads and decodes a value from localStorage (returns fallback if missing/broken).
function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error("Could not read " + key, error);
    return fallback;
  }
}

// This function encodes and saves a value to localStorage. Returns true if it worked.
function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Could not save " + key, error);
    return false;
  }
}

// This function shows a message; adds the "success" class for green, removes it for red.
function setMessage(elementId, text, isSuccess) {
  const element = document.getElementById(elementId);
  if (!element) {
    return;
  }
  element.textContent = text;
  if (isSuccess) {
    element.classList.add("success");
  } else {
    element.classList.remove("success");
  }
}

// Compares two ids as text, because ids may be stored as numbers or strings.
function sameId(a, b) {
  return String(a) === String(b);
}

// Returns the students in the currently selected form level.
function getClassStudents() {
  const students = loadData(KEY_STUDENTS, []);
  return students.filter(s => s.formLevel === selectedFormLevel);
}

// Empties the grade table and report card (used when earlier choices change).
function clearGradeAndReport() {
  document.getElementById("gradeFormContainer").textContent = "";
  document.getElementById("reportCardContainer").textContent = "";
  document.getElementById("maxScoreInput").value = "";
  document.getElementById("assessmentSelect").value = "";
  document.getElementById("reportStudentSelect").value = "";
  selectedAssessment = "";
  setMessage("gradeMessage", "", false);
}

// Runs once when the page loads: checks login, fills the first dropdown, connects buttons.
function initTeacherPage() {
  // checkTeacher() comes from login.js and redirects if not logged in as a teacher.
  checkTeacher();
  if (localStorage.getItem("role") !== "teacher") {
    return;
  }

  fillSubjectDropdown();

  const subjectSelect = document.getElementById("subjectSelect");
  const formSelect = document.getElementById("formSelect");
  const assessmentSelect = document.getElementById("assessmentSelect");
  const reportStudentSelect = document.getElementById("reportStudentSelect");

  subjectSelect.addEventListener("change", (e) => {
    selectedSubjectCode = e.target.value;
    selectedFormLevel = "";
    setMessage("step1Message", "", false);

    // A new subject invalidates everything chosen after it.
    document.getElementById("classList").textContent = "";
    clearGradeAndReport();
    fillFormDropdown();
  });

  formSelect.addEventListener("change", (e) => {
    selectedFormLevel = e.target.value;
    setMessage("step2Message", "", false);
    clearGradeAndReport();
    loadClassList();
    fillReportStudentDropdown();
  });

  assessmentSelect.addEventListener("change", (e) => {
    selectedAssessment = e.target.value;
    setMessage("gradeMessage", "", false);
    document.getElementById("maxScoreInput").value = "";
    buildGradeForm();
  });

  reportStudentSelect.addEventListener("change", (e) => {
    if (e.target.value) {
      showReportCard(e.target.value);
    } else {
      document.getElementById("reportCardContainer").textContent = "";
    }
  });

  document.getElementById("nextButton").addEventListener("click", () => {
    if (validateCurrentStep() && currentStep < TOTAL_STEPS) {
      showStep(currentStep + 1);
    }
  });

  document.getElementById("backButton").addEventListener("click", () => {
    if (currentStep > 1) {
      showStep(currentStep - 1);
    }
  });

  document.getElementById("saveGradesButton").addEventListener("click", saveGrades);

  // logout() comes from login.js.
  document.getElementById("logoutButton").addEventListener("click", logout);

  showStep(1);
}

// Checks that the teacher has made a choice before moving to the next step.
function validateCurrentStep() {
  if (currentStep === 1 && !selectedSubjectCode) {
    setMessage("step1Message", "Please select a subject to proceed.", false);
    return false;
  }
  if (currentStep === 2 && !selectedFormLevel) {
    setMessage("step2Message", "Please select a form level to proceed.", false);
    return false;
  }
  if (currentStep === 3 && !selectedAssessment) {
    setMessage("gradeMessage", "Please select an assessment.", false);
    return false;
  }
  return true;
}

// Shows one step panel, hides the others and updates the progress list.
function showStep(stepNumber) {
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const panel = document.getElementById("step" + i);
    const progressItem = document.getElementById("progress" + i);

    if (i === stepNumber) {
      panel.classList.remove("hidden");
      progressItem.classList.add("active");
    } else {
      panel.classList.add("hidden");
      progressItem.classList.remove("active");
    }
  }

  currentStep = stepNumber;
  document.getElementById("progressText").textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;

  document.getElementById("backButton").style.display = currentStep === 1 ? "none" : "inline-block";
  document.getElementById("nextButton").style.display = currentStep === TOTAL_STEPS ? "none" : "inline-block";

  if (currentStep === TOTAL_STEPS) {
    updateClassStats();
  }
}


// Fills the subject dropdown with the logged-in teacher's subjects (or all subjects if none are linked).
function fillSubjectDropdown() {
  const username = localStorage.getItem("username");
  const users = loadData(KEY_USERS, []);
  const teachers = loadData(KEY_TEACHERS, []);
  const subjects = loadData(KEY_SUBJECTS, []);
  const subjectSelect = document.getElementById("subjectSelect");

  const currentUser = users.find(u => u.username === username);
  let currentTeacher = null;
  if (currentUser) {
    currentTeacher = teachers.find(t => t.teacherId === currentUser.teacherId);
  }

  let teacherSubjects = subjects;
  if (currentTeacher && currentTeacher.subjects) {
    teacherSubjects = subjects.filter(s => currentTeacher.subjects.includes(s.code));
  }

  subjectSelect.innerHTML = '<option value="">-- Select one of the subjects --</option>';
  teacherSubjects.forEach(subject => {
    const option = document.createElement("option");
    option.value = subject.code;
    option.textContent = subject.name;
    subjectSelect.appendChild(option);
  });
}

// Fills the form-level dropdown with each form level once.
function fillFormDropdown() {
  const students = loadData(KEY_STUDENTS, []);
  const formLevels = [];

  students.forEach(student => {
    if (student.formLevel && !formLevels.includes(student.formLevel)) {
      formLevels.push(student.formLevel);
    }
  });
  formLevels.sort();

  const formSelect = document.getElementById("formSelect");
  formSelect.innerHTML = '<option value="">-- Select a form level --</option>';
  formLevels.forEach(level => {
    const option = document.createElement("option");
    option.value = level;
    option.textContent = level;
    formSelect.appendChild(option);
  });
}

// Lists the students in the selected form level.
function loadClassList() {
  const classStudents = getClassStudents();
  const classListUl = document.getElementById("classList");
  classListUl.textContent = "";

  if (classStudents.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No students found in this class.";
    classListUl.appendChild(li);
    return;
  }

  classStudents.forEach(student => {
    const li = document.createElement("li");
    li.textContent = `${student.firstName} ${student.lastName} (ID: ${student.id})`;
    classListUl.appendChild(li);
  });
}

// Fills the Step 4 student dropdown for the selected class.
function fillReportStudentDropdown() {
  const reportStudentSelect = document.getElementById("reportStudentSelect");
  reportStudentSelect.innerHTML = '<option value="">-- Select a student --</option>';

  getClassStudents().forEach(student => {
    const option = document.createElement("option");
    option.value = student.id;
    option.textContent = `${student.firstName} ${student.lastName} (${student.id})`;
    reportStudentSelect.appendChild(option);
  });
}

// Builds one row per student with a score box, pre-filled with any saved score.
function buildGradeForm() {
  const container = document.getElementById("gradeFormContainer");
  container.textContent = "";

  if (!selectedFormLevel || !selectedAssessment) {
    return;
  }

  const classStudents = getClassStudents();
  if (classStudents.length === 0) {
    container.textContent = "No students in this class.";
    return;
  }

  const grades = loadData(KEY_GRADES, []);
  const maxScoreInput = document.getElementById("maxScoreInput");

  const table = document.createElement("table");
  table.className = "grade-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Student Name</th>
        <th scope="col">Score</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  classStudents.forEach(student => {
    const tr = document.createElement("tr");

    const nameTd = document.createElement("td");
    nameTd.textContent = `${student.firstName} ${student.lastName}`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.className = "student-score-input";
    input.setAttribute("data-student-id", student.id);
    input.setAttribute("aria-label", `Score for ${student.firstName} ${student.lastName}`);

    const existingGrade = grades.find(g =>
      sameId(g.studentId, student.id) &&
      g.subjectCode === selectedSubjectCode &&
      g.semester === SEMESTER &&
      g.assessment === selectedAssessment
    );

    if (existingGrade) {
      input.value = existingGrade.score;
      if (!maxScoreInput.value) {
        maxScoreInput.value = existingGrade.maxScore;
      }
    }

    const inputTd = document.createElement("td");
    inputTd.appendChild(input);
    tr.appendChild(nameTd);
    tr.appendChild(inputTd);
    tbody.appendChild(tr);
  });

  container.appendChild(table);
}

// Returns true if the score is a number between 0 and the maximum.
function validateScore(score, maxScore) {
  if (score === "" || isNaN(score)) {
    return false;
  }
  const numScore = Number(score);
  return numScore >= 0 && numScore <= maxScore;
}

// Validates every score, then replaces the saved grades for this class/subject/assessment.
function saveGrades() {
  const maxScore = Number(document.getElementById("maxScoreInput").value);
  if (!selectedAssessment) {
    setMessage("gradeMessage", "Please select an assessment.", false);
    return;
  }
  if (!maxScore || maxScore <= 0) {
    setMessage("gradeMessage", "Please enter a valid 'Marked out of' value greater than 0.", false);
    return;
  }

  const inputs = document.querySelectorAll(".student-score-input");
  const newRecords = [];
  const classStudentIds = [];
  let allValid = true;

  inputs.forEach(input => {
    const studentId = input.getAttribute("data-student-id");
    const scoreText = input.value.trim();
    classStudentIds.push(studentId);
    input.classList.remove("invalid");

    if (scoreText === "") {
      return; // Blank means no score yet.
    }

    if (validateScore(scoreText, maxScore)) {
      newRecords.push({
        studentId: studentId,
        subjectCode: selectedSubjectCode,
        semester: SEMESTER,
        assessment: selectedAssessment,
        score: Number(scoreText),
        maxScore: maxScore
      });
    } else {
      allValid = false;
      input.classList.add("invalid");
    }
  });

  if (!allValid) {
    setMessage("gradeMessage", "One or more scores are invalid or exceed the maximum score. Please check the highlighted fields.", false);
    return;
  }

  // Remove the old records for this class/subject/assessment, then add the new ones.
  const grades = loadData(KEY_GRADES, []).filter(g => {
    const isThisClass = classStudentIds.some(id => sameId(id, g.studentId));
    const isThisAssessment = g.subjectCode === selectedSubjectCode &&
                             g.semester === SEMESTER &&
                             g.assessment === selectedAssessment;
    return !(isThisClass && isThisAssessment);
  });
  newRecords.forEach(record => grades.push(record));

  if (saveData(KEY_GRADES, grades)) {
    setMessage("gradeMessage", "Grades successfully saved!", true);
  } else {
    setMessage("gradeMessage", "Error saving grades to storage.", false);
  }
}

// Groups one student's grade records by subject code.
function groupBySubject(studentGrades) {
  const groups = {};
  studentGrades.forEach(g => {
    if (!groups[g.subjectCode]) {
      groups[g.subjectCode] = [];
    }
    groups[g.subjectCode].push(g);
  });
  return groups;
}

// Updates the class average, highest, lowest and pass rate for the chosen subject.
function updateClassStats() {
  const grades = loadData(KEY_GRADES, []);
  const totals = [];

  getClassStudents().forEach(student => {
    const records = grades.filter(g =>
      sameId(g.studentId, student.id) &&
      g.subjectCode === selectedSubjectCode &&
      g.semester === SEMESTER
    );
    if (records.length > 0) {
      totals.push(calculateWeighted(records).total);
    }
  });

  const stats = getClassStats(totals);
  document.getElementById("classAverage").textContent = stats.average.toFixed(1) + "%";
  document.getElementById("classHighest").textContent = stats.highest.toFixed(1) + "%";
  document.getElementById("classLowest").textContent = stats.lowest.toFixed(1) + "%";
  document.getElementById("classPassRate").textContent = stats.passRate.toFixed(0) + "%";
}

// Builds the report card for one student using DOM methods (no raw innerHTML).
function showReportCard(studentId) {
  const container = document.getElementById("reportCardContainer");
  container.textContent = "";

  const student = loadData(KEY_STUDENTS, []).find(s => sameId(s.id, studentId));
  if (!student) {
    container.textContent = "Student not found.";
    return;
  }

  const studentGrades = loadData(KEY_GRADES, []).filter(g =>
    sameId(g.studentId, studentId) && g.semester === SEMESTER
  );
  if (studentGrades.length === 0) {
    container.textContent = `No grade records found for ${student.firstName} ${student.lastName}.`;
    return;
  }

  const subjects = loadData(KEY_SUBJECTS, []);
  const groups = groupBySubject(studentGrades);
  const completeTotals = [];

  const box = document.createElement("div");
  box.className = "report-card-box";

  const heading = document.createElement("h3");
  heading.textContent = `Report Card: ${student.firstName} ${student.lastName} (${student.id})`;
  const info = document.createElement("p");
  info.textContent = `Form Level: ${student.formLevel} | Semester: ${SEMESTER}`;

  const table = document.createElement("table");
  table.className = "report-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Subject</th>
        <th scope="col">Weighted Total</th>
        <th scope="col">Letter Grade</th>
        <th scope="col">Status</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  for (const code in groups) {
    const subject = subjects.find(s => s.code === code);
    const result = calculateWeighted(groups[code]);

    // A letter grade is only meaningful once every assessment has been entered.
    let letter = "In progress";
    let status = `Incomplete (${result.weightEntered}% entered)`;
    if (result.isComplete) {
      letter = getLetterGrade(result.total);
      status = "Complete";
      completeTotals.push(result.total);
    }

    const tr = document.createElement("tr");
    const cells = [
      subject ? subject.name : code,
      result.total.toFixed(1) + "%",
      letter,
      status
    ];
    cells.forEach(text => {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  const average = document.createElement("h4");
  if (completeTotals.length > 0) {
    average.textContent = `Overall Average: ${calculateAverage(completeTotals).toFixed(1)}%`;
  } else {
    average.textContent = "Overall Average: available once a subject is complete";
  }

  box.appendChild(heading);
  box.appendChild(info);
  box.appendChild(table);
  box.appendChild(average);
  container.appendChild(box);
}


document.addEventListener("DOMContentLoaded", initTeacherPage);
