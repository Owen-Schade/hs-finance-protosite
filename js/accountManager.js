/* Lightweight manager for chart of accounts stored in localStorage */
class AccountManager {
  constructor() {
    this.accounts = Storage.getAccounts();
  }
  getAccounts() { return [...this.accounts]; }
  getOptions(selected){ return Utils.buildOptions(this.accounts, selected); }
  addAccount(name) { if (name && !this.accounts.includes(name)) { this.accounts.push(name); Storage.saveAccounts(this.accounts); } }
  save() { Storage.saveAccounts(this.accounts); }
}