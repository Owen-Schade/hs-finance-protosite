/* Manages a list of pending checks before they are attached to a transaction */
class CheckManager {
  constructor(initial = []) {
    this._checks = Array.isArray(initial) ? [...initial] : [];
  }
  add(number, amount) {
    this._checks.push({ number, amount });
  }
  remove(idx) {
    if (idx >= 0 && idx < this._checks.length) this._checks.splice(idx, 1);
  }
  list() {
    return [...this._checks];
  }
  total() {
    return this._checks.reduce((s, c) => s + (c.amount || 0), 0);
  }
  clear() {
    this._checks = [];
  }
  setList(arr) {
    this._checks = Array.isArray(arr) ? [...arr] : [];
  }
}