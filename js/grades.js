/*
 * File: grades.js
 * Members: 1. Mario Creary - 2504252 - Friday 12pm - 2pm
 *          2. Nathan Mannings - 2501919 - Friday 12pm - 2pm
 *          3. Kayla Johnson - 2409453 - Friday 12pm - 2pm
 *          4. Damani Williams - 2007591 - Friday 12pm - 2pm
 *          5. Jamelia Freeman - 2407243 - Friday 12pm - 2pm
 */

// Weight (out of 100) of each assessment in the final grade.
const ASSESSMENT_WEIGHTS = {
    "Quiz 1": 5,
    "Quiz 2": 5,
    "Quiz 3": 5,
    "Test 1": 5,
    "Test 2": 5,
    "Test 3": 5,
    "Group Project": 30,
    "Final Exam": 40
};

// Lowest weighted total that counts as a pass.
const PASSING_GRADE = 50;

// Receives a final percentage and returns the matching letter grade.
function getLetterGrade(total) {
    if (total >= 80) {
        return "A";
    } else if (total >= 70) {
        return "B";
    } else if (total >= 60) {
        return "C";
    } else if (total >= 50) {
        return "D";
    } else if (total >= 40) {
        return "E";
    } else {
        return "F";
    }
}

// Calculates a student's weighted total from their assessment records.
function calculateWeighted(records) {
    let total = 0;
    let weightEntered = 0;

    for (let i = 0; i < records.length; i++) {
        const weight = ASSESSMENT_WEIGHTS[records[i].assessment];

        // Skip records whose assessment name has no weight (avoids NaN).
        if (weight === undefined) {
            continue;
        }

        const percentage = records[i].score / records[i].maxScore;
        total = total + percentage * weight;
        weightEntered = weightEntered + weight;
    }

    return {
        total: total,
        weightEntered: weightEntered,
        isComplete: weightEntered === 100
    };
}

// Calculates the average of an array of numbers.
function calculateAverage(totals) {
    if (totals.length === 0) {
        return 0;
    }

    let sum = 0;
    for (let i = 0; i < totals.length; i++) {
        sum = sum + totals[i];
    }

    return sum / totals.length;
}

// Calculates the highest, lowest, average and pass rate for a class.
function getClassStats(totals) {
    if (totals.length === 0) {
        return { highest: 0, lowest: 0, average: 0, passRate: 0 };
    }

    let highest = totals[0];
    let lowest = totals[0];
    let passed = 0;

    for (let i = 0; i < totals.length; i++) {
        if (totals[i] > highest) {
            highest = totals[i];
        }
        if (totals[i] < lowest) {
            lowest = totals[i];
        }
        if (totals[i] >= PASSING_GRADE) {
            passed++;
        }
    }

    return {
        highest: highest,
        lowest: lowest,
        average: calculateAverage(totals),
        passRate: (passed / totals.length) * 100
    };
}
