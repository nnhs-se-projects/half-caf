const incompleteButtons = document.querySelectorAll("button.incompleteButton");

for (const incompleteButton of incompleteButtons) {
  incompleteButton.addEventListener("click", async () => {
    const orderId = incompleteButton.value;

    incompleteButton.disabled = true;

    const response = await fetch(`/barista/completedOrders/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      window.location = "/barista/completedOrders";
    } else {
      console.log("error incompleting order");
    }
  });
}

// Search functionality
const searchInput = document.getElementById('orderSearch');
const clearSearchBtn = document.getElementById('clearSearch');
const orderTable = document.getElementById('orderTable');
const orderRows = orderTable.querySelectorAll('tbody tr');

function filterOrders() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  orderRows.forEach(row => {
    const roomCell = row.cells[0]; // Room column
    const teacherCell = row.cells[1]; // Teacher column
    
    if (roomCell && teacherCell) {
      const roomText = roomCell.textContent.toLowerCase();
      const teacherText = teacherCell.textContent.toLowerCase();
      
      // Check if search term matches room or teacher name
      const matches = roomText.includes(searchTerm) || teacherText.includes(searchTerm);
      
      // Show/hide row based on match
      row.style.display = matches || searchTerm === '' ? '' : 'none';
    }
  });
}

function clearSearch() {
  searchInput.value = '';
  filterOrders();
}

// Add event listeners
searchInput.addEventListener('input', filterOrders);
clearSearchBtn.addEventListener('click', clearSearch);
