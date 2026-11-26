/*
    Nathan Mannings - 2501919 Friday 12pm - 2pm
    Damani Williams - 2007591 Friday 12pm - 2pm
    Jamelia Freeman - 2407243 Friday 12pm - 2pm
    Kayla Johnson   - 2409453 Friday 12pm - 2pm
    Mario Creary    - 2504252 Friday 12pm - 2pm

    Jamelia Freeman - Finance and Reporting
    TranHistory.js: lists every saved transaction and lets the administrator delete one.
    Needs finance-common.js to be loaded first.
*/

const historyTableBody = document.getElementById("tranHistory");

//draw every saved transaction into the history table
function renderHistory() {
  historyTableBody.textContent = "";
  const transactions = loadList(historyStorageKey); //load saved transactions for the history table

  transactions.forEach((transaction) => {
    const row = historyTableBody.insertRow();
    //keep transaction fields in the same order as the table headers
    [transaction.stuId, transaction.tranNum, transaction.tranAmt, transaction.tranDate, transaction.tranType]
      .forEach((value) => {
        row.insertCell().textContent = value;
      });

    //only the administrator gets a delete button
    if (isFinanceAdmin()) {
      //store the transaction number (not the row position) on the delete button so the correct record is always removed
      const deleteCell = row.insertCell();
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-transaction";
      deleteButton.dataset.tranNum = transaction.tranNum;
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete transaction ${transaction.tranNum}`);
      deleteCell.appendChild(deleteButton);
    }
  });

  //show a friendly message when there is nothing to list
  if (transactions.length === 0) {
    const row = historyTableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = isFinanceAdmin() ? 6 : 5;
    cell.textContent = "No transactions have been recorded yet.";
  }
}

//render history only on pages that contain the transaction table
if (historyTableBody) {
  renderHistory();

  //handle all row delete buttons with one listener on the table body
  historyTableBody.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".delete-transaction");
    if (!deleteButton || !historyTableBody.contains(deleteButton)) {
      return;
    }

    //read-only users cannot delete even if the button was added by hand
    if (!isFinanceAdmin()) {
      alert("Only an administrator can delete transactions.");
      return;
    }

    //leave the stored transaction unchanged unless the user confirms
    if (!window.confirm("Are you sure you want to delete this transaction entry?")) {
      return;
    }

    try {
      const transactions = loadList(historyStorageKey);
      const transactionIndex = transactions.findIndex((t) => t.tranNum === deleteButton.dataset.tranNum);
      if (transactionIndex === -1) {
        throw new Error("The selected transaction no longer exists");
      }

      //update storage and redraw the table so it reflects the deletion
      transactions.splice(transactionIndex, 1); //remove the selected record
      if (!saveList(historyStorageKey, transactions)) { //save the updated transaction list
        throw new Error("The updated transaction list could not be saved");
      }
      renderHistory();
    } catch (error) {
      //notify the user if the deletion cannot be saved
      console.error("Could not delete transaction.", error);
      alert("Transaction could not be deleted. Please check browser storage settings and try again.");
    }
  });
}
