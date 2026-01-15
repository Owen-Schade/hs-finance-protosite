/* Storage helper for persisting and retrieving app data from localStorage */
class Storage {
  static getTransactions() {
    return JSON.parse(localStorage.getItem('financialTransactions')) || [];
  }
  static saveTransactions(arr) {
    localStorage.setItem('financialTransactions', JSON.stringify(arr));
  }
  static getAccounts() {
    return JSON.parse(localStorage.getItem('chartOfAccounts')) || ['Checking','Savings','Income','Expense','Accounts Receivable','Accounts Payable'];
  }
  static saveAccounts(arr) {
    localStorage.setItem('chartOfAccounts', JSON.stringify(arr));
  }
  static getStartingBalance() {
    return parseFloat(localStorage.getItem('startingBalance') || '0');
  }
  static saveStartingBalance(v) {
    localStorage.setItem('startingBalance', (parseFloat(v) || 0).toString());
  }
}