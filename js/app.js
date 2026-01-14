// Financial Manager App
class FinancialManager {
  constructor() {
    this.entries = JSON.parse(localStorage.getItem('financialEntries')) || [];
    this.editingId = null;
    this.initElements();
    this.attachEventListeners();
    this.renderTable();
    this.updateSummary();
  }

  initElements() {
    this.form = document.getElementById('entryForm');
    this.descInput = document.getElementById('description');
    this.amountInput = document.getElementById('amount');
    this.typeInput = document.getElementById('type');
    this.dateInput = document.getElementById('date');
    this.tableBody = document.getElementById('tableBody');
    this.cancelBtn = document.getElementById('cancelBtn');
    this.formTitle = document.getElementById('form-title');
  }

  attachEventListeners() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.cancelBtn.addEventListener('click', () => this.cancelEdit());
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    this.dateInput.value = today;
  }

  handleSubmit(e) {
    e.preventDefault();

    const entry = {
      id: this.editingId || Date.now(),
      description: this.descInput.value,
      amount: parseFloat(this.amountInput.value),
      type: this.typeInput.value,
      date: this.dateInput.value
    };

    if (this.editingId) {
      // Update existing entry
      const index = this.entries.findIndex(e => e.id === this.editingId);
      if (index !== -1) {
        this.entries[index] = entry;
      }
      this.cancelEdit();
    } else {
      // Add new entry
      this.entries.push(entry);
    }

    this.saveToLocalStorage();
    this.renderTable();
    this.updateSummary();
    this.form.reset();
    const today = new Date().toISOString().split('T')[0];
    this.dateInput.value = today;
  }

  editEntry(id) {
    const entry = this.entries.find(e => e.id === id);
    if (!entry) return;

    this.editingId = id;
    this.descInput.value = entry.description;
    this.amountInput.value = entry.amount;
    this.typeInput.value = entry.type;
    this.dateInput.value = entry.date;

    this.formTitle.textContent = 'Edit Entry';
    this.cancelBtn.style.display = 'inline-block';
    this.form.querySelector('button[type="submit"]').textContent = 'Update Entry';

    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  }

  deleteEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
      this.entries = this.entries.filter(e => e.id !== id);
      this.saveToLocalStorage();
      this.renderTable();
      this.updateSummary();
    }
  }

  cancelEdit() {
    this.editingId = null;
    this.formTitle.textContent = 'Add New Entry';
    this.cancelBtn.style.display = 'none';
    this.form.querySelector('button[type="submit"]').textContent = 'Add Entry';
    this.form.reset();
    const today = new Date().toISOString().split('T')[0];
    this.dateInput.value = today;
  }

  renderTable() {
    this.tableBody.innerHTML = '';

    if (this.entries.length === 0) {
      this.tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No entries yet. Add one to get started!</td></tr>';
      return;
    }

    // Sort entries by date (newest first)
    const sorted = [...this.entries].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(entry => {
      const row = document.createElement('tr');
      row.className = entry.type;
      
      const formattedAmount = this.formatCurrency(entry.amount);
      const formattedDate = this.formatDate(entry.date);

      row.innerHTML = `
        <td>${entry.description}</td>
        <td>${formattedAmount}</td>
        <td><span style="text-transform: capitalize;">${entry.type}</span></td>
        <td>${formattedDate}</td>
        <td class="actions">
          <button class="btn btn-edit" onclick="app.editEntry(${entry.id})">Edit</button>
          <button class="btn btn-delete" onclick="app.deleteEntry(${entry.id})">Delete</button>
        </td>
      `;

      this.tableBody.appendChild(row);
    });
  }

  updateSummary() {
    const totalIncome = this.entries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = this.entries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    const net = totalIncome - totalExpenses;

    document.getElementById('totalIncome').textContent = this.formatCurrency(totalIncome);
    document.getElementById('totalExpenses').textContent = this.formatCurrency(totalExpenses);
    
    const netElement = document.getElementById('netAmount');
    netElement.textContent = this.formatCurrency(net);
    netElement.style.color = net >= 0 ? '#4CAF50' : '#f44336';
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  }

  saveToLocalStorage() {
    localStorage.setItem('financialEntries', JSON.stringify(this.entries));
  }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new FinancialManager();
});
