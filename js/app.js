// Financial Manager App

// Storage, CheckManager, and AccountManager have been moved to separate files:
// js/storage.js, js/checkManager.js, js/accountManager.js
// They are loaded before app.js so their classes are available here.

/**
 * Main application controller: manages transactions, UI, and interactions.
 */
class FinancialManager {
  constructor() {
    this.transactions = Storage.getTransactions();
    this.editingId = null;
    this.inlineEditingId = null;
    this.sortState = null;
    this.initElements();
    this.attachEventListeners();
    this.renderTable();
    this.updateSummary();
    this.setTodayDate();
    // Ensure initial responsive class is applied
    this.handleResize();
  }

  initElements() {
    this.tableBody = document.getElementById('tableBody');
    this.newDate = document.getElementById('newDate');
    this.newType = document.getElementById('newType');
    this.newRef = document.getElementById('newRef');
    this.newPayee = document.getElementById('newPayee');
    this.newClass = document.getElementById('newClass');
    this.newLocation = document.getElementById('newLocation');
    this.newPayment = document.getElementById('newPayment');
    this.newDeposit = document.getElementById('newDeposit');
    this.newAccount = document.getElementById('newAccount');
    this.newMemo = document.getElementById('newMemo');
    this.newReconciled = document.getElementById('newReconciled');
    this.newVoid = document.getElementById('newVoid');
    this.addBtn = document.getElementById('addBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.toggleEntryBtn = document.getElementById('toggleEntryBtn');
    this.toggleGroupBtn = document.getElementById('toggleGroupBtn');
    this.showChecksLink = document.getElementById('showChecksLink');
    this.visibleChecks = new Set();

    // Inline group elements
    this.groupAddRow = document.getElementById('groupAddRow');
    this.groupCheckEntryRow = document.getElementById('groupCheckEntryRow');
    this.groupDate = document.getElementById('groupDate');
    this.groupType = document.getElementById('groupType');
    this.groupLocation = document.getElementById('groupLocation');
    this.groupMemo = document.getElementById('groupMemo');
    this.groupPayment = document.getElementById('groupPayment');
    this.groupDeposit = document.getElementById('groupDeposit');
    this.groupReconciled = document.getElementById('groupReconciled');
    this.groupVoid = document.getElementById('groupVoid');

    // group inline check inputs
    this.grpCheckRef = document.getElementById('grpCheckRef');
    this.grpCheckPayee = document.getElementById('grpCheckPayee');
    this.grpCheckAccount = document.getElementById('grpCheckAccount');
    this.grpCheckClass = document.getElementById('grpCheckClass');
    this.grpCheckAmt = document.getElementById('grpCheckAmt');
    this.grpCheckDepositAmt = document.getElementById('grpCheckDepositAmt');
    this.grpCheckDesc = document.getElementById('grpCheckDesc');
    this.grpCheckMethod = document.getElementById('grpCheckMethod');
    this.addGroupCheckBtn = document.getElementById('addGroupCheckBtn');
    this.clearGroupChecksBtn = document.getElementById('clearGroupChecksBtn');
    this.groupChecksTotal = document.getElementById('groupChecksTotal');
    this.addGroupBtn = document.getElementById('addGroupBtn');
    this.cancelGroupBtn = document.getElementById('cancelGroupBtn');

    this.groupChecks = [];
    this.editingGroupId = null;

    // checks UI
    this.checksRow = document.getElementById('checksRow');
    this.checkNumInput = document.getElementById('checkNumInput');
    this.checkAmtInput = document.getElementById('checkAmtInput');
    this.addCheckBtn = document.getElementById('addCheckBtn');
    this.clearChecksBtn = document.getElementById('clearChecksBtn');
    this.checksList = document.getElementById('checksList');
    this.checksTotal = document.getElementById('checksTotal');

    // managers for checks and accounts
    this.checkManager = new CheckManager();
    this.accountManager = new AccountManager();
    this.populateAccounts();
  }

  attachEventListeners() {
    // Button actions
    this.addBtn.addEventListener('click', () => this.handleAddTransaction());
    this.clearBtn.addEventListener('click', () => {
      this.clearForm();
      const addRow = this.tableBody.querySelector('.add-row');
      if (addRow) addRow.style.display = 'none';
      if (this.checksRow) this.checksRow.style.display = 'none';
      if (this.toggleEntryBtn) this.toggleEntryBtn.textContent = 'New Entry';
      // reset group UI
      if (this.toggleGroupBtn) this.toggleGroupBtn.textContent = 'New Group';
      // reset visible checks UI
      this.visibleChecks.clear();
      // hide inline group rows if visible
      const groupRow = document.getElementById('groupAddRow');
      const entryRow = document.getElementById('groupCheckEntryRow');
      if (groupRow) groupRow.style.display = 'none';
      if (entryRow) entryRow.style.display = 'none';
    });

    // toggle adding entry visibility
    if (this.toggleEntryBtn) {
      this.toggleEntryBtn.addEventListener('click', () => {
        const addRow = this.tableBody.querySelector('.add-row');
        if (!addRow) return;
        const showing = addRow.style.display !== 'table-row' && addRow.style.display !== '';
        if (showing) {
          // show add row and hide group inline rows if visible
          addRow.style.display = 'table-row';
          this.toggleEntryBtn.textContent = 'Hide Entry';
          const groupRow = this.tableBody.querySelector('#groupAddRow');
          const entryRow = this.tableBody.querySelector('#groupCheckEntryRow');
          if (groupRow) groupRow.style.display = 'none';
          if (entryRow) entryRow.style.display = 'none';
          if (this.toggleGroupBtn) this.toggleGroupBtn.textContent = 'New Group';
          if (this.checkManager && this.checkManager.total() > 0 && this.checksRow) {
            this.checksRow.style.display = 'table-row';
          }
        } else {
          // hide add row
          addRow.style.display = 'none';
          this.toggleEntryBtn.textContent = 'New Entry';
          if (this.checksRow) this.checksRow.style.display = 'none';
        }
        if (showing && this.newDate) this.newDate.focus();
      });
    }

    // show/hide checks link
    if (this.showChecksLink) {
      this.showChecksLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (!this.checksRow) return;
        const showing = this.checksRow.style.display !== 'table-row';
        this.checksRow.style.display = showing ? 'table-row' : 'none';
        this.showChecksLink.textContent = showing ? 'Hide checks' : 'Show checks';
      });
    }

    // checks add/clear
    if (this.addCheckBtn) {
      this.addCheckBtn.addEventListener('click', () => this.addCheck());
    }
    if (this.clearChecksBtn) {
      this.clearChecksBtn.addEventListener('click', () => { this.checkManager.clear(); this.updateChecksUI(); if (this.checksRow) this.checksRow.style.display = 'none'; });
    }

    // group-specific checks add/clear
    if (this.addGroupCheckBtn) {
      this.addGroupCheckBtn.addEventListener('click', () => this.addGroupCheck());
    }
    if (this.clearGroupChecksBtn) {
      this.clearGroupChecksBtn.addEventListener('click', () => { 
        this.groupChecks = []; 
        this.updateGroupChecksUI(); 
        if (this.grpCheckAmt) { this.grpCheckAmt.value = ''; this.grpCheckAmt.disabled = false; }
        if (this.grpCheckDepositAmt) { this.grpCheckDepositAmt.value = ''; this.grpCheckDepositAmt.disabled = false; }
      });
    }

    // Mutual exclusion: entering a Payment disables Deposit and vice versa for the main entry
    if (this.newPayment && this.newDeposit) {
      const toggleEntryAmounts = () => {
        const p = parseFloat(this.newPayment.value) || 0;
        const d = parseFloat(this.newDeposit.value) || 0;
        if (p > 0) { this.newDeposit.value = ''; this.newDeposit.disabled = true; }
        else if (d > 0) { this.newPayment.value = ''; this.newPayment.disabled = true; }
        else { this.newPayment.disabled = false; this.newDeposit.disabled = false; }
      };
      this.newPayment.addEventListener('input', toggleEntryAmounts);
      this.newDeposit.addEventListener('input', toggleEntryAmounts);
    }

    // Mutual exclusion: group check entry payment vs deposit
    if (this.grpCheckAmt && this.grpCheckDepositAmt) {
      const toggleGroupAmounts = () => {
        const p = parseFloat(this.grpCheckAmt.value) || 0;
        const d = parseFloat(this.grpCheckDepositAmt.value) || 0;
        if (p > 0) { this.grpCheckDepositAmt.value = ''; this.grpCheckDepositAmt.disabled = true; }
        else if (d > 0) { this.grpCheckAmt.value = ''; this.grpCheckAmt.disabled = true; }
        else { this.grpCheckAmt.disabled = false; this.grpCheckDepositAmt.disabled = false; }
      };
      this.grpCheckAmt.addEventListener('input', toggleGroupAmounts);
      this.grpCheckDepositAmt.addEventListener('input', toggleGroupAmounts);
    }

    // group add/cancel
    if (this.addGroupBtn) {
      this.addGroupBtn.addEventListener('click', () => this.handleAddGroup());
    }
    if (this.cancelGroupBtn) {
      // Cancel the standalone group form without revealing the single-entry add row
      this.cancelGroupBtn.addEventListener('click', () => this.cancelGroup(false));
    }

    // group checks remove via the list UI
    if (this.groupChecksList) {
      this.groupChecksList.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-group-check');
        if (!btn) return;
        const idx = parseInt(btn.dataset.idx, 10);
        if (!Number.isNaN(idx)) this.removeGroupCheck(idx);
      });
    }

    // Group form enter-to-add behavior
    [this.groupDate, this.groupType, this.groupLocation, this.groupMemo, this.grpCheckPayee, this.grpCheckAccount, this.grpCheckDesc, this.grpCheckMethod, this.grpCheckRef, this.grpCheckAmt, this.grpCheckClass].forEach(el => {
      if (!el) return;
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          // If focus is inside a check field try to add a check, otherwise submit group
          if (document.activeElement && [this.grpCheckPayee, this.grpCheckAmt, this.grpCheckRef].includes(document.activeElement)) {
            this.addGroupCheck();
          } else {
            this.handleAddGroup();
          }
        }
      });
    });

    // Allow pressing Enter on any form input to submit
    [this.newDate, this.newRef, this.newType, this.newPayee, this.newClass, this.newLocation, this.newPayment, this.newDeposit, this.newAccount, this.newMemo, this.checkNumInput, this.checkAmtInput].forEach(el => {
      if (!el) return;
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleAddTransaction();
        }
      });
    });

    // Event delegation for edit/delete buttons and inline save/cancel, and checkbox changes
    this.tableBody.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit');
      const delBtn = e.target.closest('.btn-delete');
      const saveBtn = e.target.closest('.btn-inline-save');
      const cancelBtn = e.target.closest('.btn-inline-cancel');
      const groupSaveBtn = e.target.closest('.btn-group-save');
      const groupCancelBtn = e.target.closest('.btn-group-cancel');
      const inlineAddGroupCheckBtn = e.target.closest('.inline-add-group-check');
      const inlineClearGroupChecksBtn = e.target.closest('.inline-clear-group-checks');

      if (editBtn) {
        const id = parseInt(editBtn.dataset.id, 10);
        if (!Number.isNaN(id)) {
          const tx = this.transactions.find(t => t.id === id);
          if (tx && tx.group) {
            this.startGroupEdit(id);
          } else {
            this.startInlineEdit(id);
          }
        }
        return;
      }

      if (delBtn) {
        const id = parseInt(delBtn.dataset.id, 10);
        if (!Number.isNaN(id)) this.deleteTransaction(id);
        return;
      }

      if (saveBtn) {
        const id = parseInt(saveBtn.dataset.id, 10);
        if (!Number.isNaN(id)) this.saveInlineEdit(id);
        return;
      }

      if (cancelBtn) {
        const id = parseInt(cancelBtn.dataset.id, 10);
        if (!Number.isNaN(id)) this.cancelInlineEdit(id);
        return;
      }

      if (groupSaveBtn) {
        const id = parseInt(groupSaveBtn.dataset.id, 10);
        if (!Number.isNaN(id)) this.saveGroupEditInline(id);
        return;
      }

      if (groupCancelBtn) {
        const id = parseInt(groupCancelBtn.dataset.id, 10);
        if (!Number.isNaN(id)) this.cancelGroupInline(id);
        return;
      }

      // toggle checks for a transaction
      const toggleChecksBtn = e.target.closest('.toggle-checks-btn');
      if (toggleChecksBtn) {
        const id = parseInt(toggleChecksBtn.dataset.id, 10);
        if (!Number.isNaN(id)) {
          if (this.visibleChecks.has(id)) this.visibleChecks.delete(id); else this.visibleChecks.add(id);
          this.renderTable();
        }
        return;
      }

      // checks list remove (in-add-row UI)
      const removeCheckBtn = e.target.closest('.remove-check');
      if (removeCheckBtn) {
        const idx = parseInt(removeCheckBtn.dataset.idx, 10);
        if (!Number.isNaN(idx)) this.removeCheck(idx);
      }

      // group checks remove (in-group-form / inline editor UI)
      const removeGroupCheckBtn = e.target.closest('.remove-group-check');
      if (removeGroupCheckBtn) {
        const idx = parseInt(removeGroupCheckBtn.dataset.idx, 10);
        if (!Number.isNaN(idx)) this.removeGroupCheck(idx);
      }

      // inline add / clear group checks inside the inline group editor
      if (inlineAddGroupCheckBtn) {
        const root = inlineAddGroupCheckBtn.closest('.group-editor-detail');
        this.addGroupCheck(root);
      }
      if (inlineClearGroupChecksBtn) {
        this.groupChecks = [];
        if (this.editingGroupId) this.renderTable(); else this.updateGroupChecksUI();
      }
    });

    // Support mutual-exclusion for inline group check amount inputs (payment vs deposit)
    this.tableBody.addEventListener('input', (e) => {
      const igAmt = e.target.closest('.ig-amt');
      const igDep = e.target.closest('.ig-dep-amt');
      if (!igAmt && !igDep) return;
      const root = e.target.closest('.group-editor-detail');
      if (!root) return;
      const pEl = root.querySelector('.ig-amt');
      const dEl = root.querySelector('.ig-dep-amt');
      const p = parseFloat(pEl && pEl.value) || 0;
      const d = parseFloat(dEl && dEl.value) || 0;
      if (p > 0) { if (dEl) { dEl.value = ''; dEl.disabled = true; } }
      else if (d > 0) { if (pEl) { pEl.value = ''; pEl.disabled = true; } }
      else { if (pEl) pEl.disabled = false; if (dEl) dEl.disabled = false; }
    });

    // Group entry toggle (shows/hides inline group rows)
    if (this.toggleGroupBtn) {
      this.toggleGroupBtn.addEventListener('click', () => {
        const groupRow = document.getElementById('groupAddRow');
        const entryRow = document.getElementById('groupCheckEntryRow');
        if (!groupRow || !entryRow) return;
        const showing = groupRow.style.display !== 'table-row' && groupRow.style.display !== '';
        if (showing) {
          // show inline group add and entry rows
          groupRow.style.display = 'table-row';
          entryRow.style.display = 'table-row';
          this.toggleGroupBtn.textContent = 'Hide Group';
          // hide add-row to keep forms exclusive
          const addRow = this.tableBody.querySelector('.add-row');
          if (addRow) addRow.style.display = 'none';
          if (this.toggleEntryBtn) this.toggleEntryBtn.textContent = 'New Entry';
          // populate account select for check entry
          this.populateGroupAccountOptions();
          if (this.groupDate) this.groupDate.focus();
        } else {
          groupRow.style.display = 'none';
          entryRow.style.display = 'none';
          this.toggleGroupBtn.textContent = 'New Group';
        }
      });
    }

    this.tableBody.addEventListener('change', (e) => {
      const recToggle = e.target.closest('.reconciled-toggle');
      const voidToggle = e.target.closest('.void-toggle');
      if (recToggle) {
        const id = parseInt(recToggle.dataset.id, 10);
        if (!Number.isNaN(id)) this.toggleReconciled(id, recToggle.checked);
      }
      if (voidToggle) {
        const id = parseInt(voidToggle.dataset.id, 10);
        if (!Number.isNaN(id)) this.toggleVoid(id, voidToggle.checked);
      }
    });

    // Header sort buttons (click to toggle ascending/descending)
    const thead = document.querySelector('.finance-table thead');
    if (thead) {
      thead.addEventListener('click', (e) => {
        const btn = e.target.closest('.sort-btn');
        if (!btn) return;
        const col = btn.dataset.col;
        if (!col) return;
        if (this.sortState && this.sortState.col === col) {
          this.sortState.dir = this.sortState.dir === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortState = { col, dir: 'asc' };
        }
        this.renderTable();
      });
    }

    // Responsive behavior on resize
    window.addEventListener('resize', () => this.handleResize());
  }

  setTodayDate() {
    if (this.newDate) this.newDate.value = Utils.todayISO();
  }

  /**
   * Gather values from the add-row, validate them, and create or update
   * a transaction object; supports checks (multiple), reconciled and void.
   */
  handleAddTransaction() {
    const date = this.newDate.value;
    const type = this.newType ? this.newType.value : '';
    const ref = this.newRef.value.trim();
    const payee = this.newPayee.value.trim();
    const txClass = this.newClass.value.trim();
    const location = this.newLocation.value.trim();
    const payment = parseFloat(this.newPayment.value) || 0;
    let deposit = parseFloat(this.newDeposit.value) || 0;
    const account = this.newAccount ? this.newAccount.value : '';
    const memo = this.newMemo ? this.newMemo.value.trim() : '';
    const reconciled = this.newReconciled ? this.newReconciled.checked : false;
    const voided = this.newVoid ? this.newVoid.checked : false;

    // If checks were added, they determine the deposit amount
    if (this.checkManager && this.checkManager.total() > 0) {
      deposit = this.checkManager.total();
    }

    if (!date || !payee) {
      alert('Please fill in at least Date and Payee');
      return;
    }

    if (payment === 0 && deposit === 0) {
      alert('Please enter either a Payment or Deposit amount');
      return;
    }

    const transaction = {
      id: this.editingId || Date.now(),
      date,
      check: '',
      type,
      ref,
      payee,
      class: txClass,
      location,
      payment,
      deposit,
      account,
      memo,
      checks: this.checkManager ? [...this.checkManager.list()] : [],
      reconciled: !!reconciled,
      voided: !!voided,
      group: false
    };

    if (this.editingId) {
      const index = this.transactions.findIndex(t => t.id === this.editingId);
      if (index !== -1) {
        this.transactions[index] = transaction;
      }
      this.editingId = null;
      this.addBtn.textContent = 'Add';
    } else {
      this.transactions.unshift(transaction);
    }

    this.checkManager.clear();
    this.updateChecksUI();
    this.saveToLocalStorage();
    this.renderTable();
    this.updateSummary();
    this.clearForm();
  }

  editTransaction(id) {
    const transaction = this.transactions.find(t => t.id === id);
    if (!transaction) return;

    this.editingId = id;
    this.newDate.value = transaction.date;
    this.newRef.value = transaction.ref;
    this.newPayee.value = transaction.payee;
    this.newClass.value = transaction.class;
    this.newLocation.value = transaction.location;
    this.newPayment.value = transaction.payment || '';
    this.newDeposit.value = transaction.deposit || '';
    if (this.newType) this.newType.value = transaction.type || '';
    if (this.newAccount) this.newAccount.value = transaction.account || '';
    if (this.newMemo) this.newMemo.value = transaction.memo || '';
    if (this.newReconciled) this.newReconciled.checked = !!transaction.reconciled;
    if (this.newVoid) this.newVoid.checked = !!transaction.voided;

    this.checkManager.setList(transaction.checks ? [...transaction.checks] : []);
    this.updateChecksUI();

    this.addBtn.textContent = 'Update';

    // Ensure payment/deposit mutual exclusion reflects edited values
    const pay = parseFloat(this.newPayment.value) || 0;
    const dep = parseFloat(this.newDeposit.value) || 0;
    if (pay > 0) { this.newDeposit.disabled = true; } else if (dep > 0) { this.newPayment.disabled = true; } else { if (this.newPayment) this.newPayment.disabled = false; if (this.newDeposit) this.newDeposit.disabled = false; }

    document.querySelector('.add-row').scrollIntoView({ behavior: 'smooth' });
  }

  /** Begin inline editing for a transaction (turn row into editable fields) */
  startInlineEdit(id) {
    // hide inline group rows to avoid UI conflicts
    const groupRow = this.tableBody.querySelector('#groupAddRow');
    const entryRow = this.tableBody.querySelector('#groupCheckEntryRow');
    if (groupRow) groupRow.style.display = 'none';
    if (entryRow) entryRow.style.display = 'none';
    if (this.toggleGroupBtn) this.toggleGroupBtn.textContent = 'New Group';

    this.inlineEditingId = id;
    this.renderTable();
    const row = this.tableBody.querySelector(`tr[data-tx-id="${id}"]`);
    if (row) row.scrollIntoView({ behavior: 'smooth' });
  }

  /** Save inline edits back to the transactions array */
  saveInlineEdit(id) {
    const row = this.tableBody.querySelector(`tr[data-tx-id="${id}"]`);
    if (!row) return;

    const dateEl = row.querySelector('.inline-date');
    const refEl = row.querySelector('.inline-ref');
    const typeEl = row.querySelector('.inline-type');
    const payeeEl = row.querySelector('.inline-payee');
    const accountEl = row.querySelector('.inline-account');
    const classEl = row.querySelector('.inline-class');
    const locationEl = row.querySelector('.inline-location');
    const paymentEl = row.querySelector('.inline-payment');
    const depositEl = row.querySelector('.inline-deposit');
    const memoEl = row.querySelector('.inline-memo');
    const recEl = row.querySelector('.inline-reconciled');
    const voidEl = row.querySelector('.inline-void');

    const date = dateEl ? dateEl.value : '';
    const ref = refEl ? refEl.value.trim() : '';
    const type = typeEl ? typeEl.value : '';
    const payee = payeeEl ? payeeEl.value.trim() : '';
    const account = accountEl ? accountEl.value : '';
    const txClass = classEl ? classEl.value.trim() : '';
    const location = locationEl ? locationEl.value.trim() : '';
    const payment = paymentEl ? parseFloat(paymentEl.value) || 0 : 0;
    let deposit = depositEl ? parseFloat(depositEl.value) || 0 : 0;
    const memo = memoEl ? memoEl.value.trim() : '';
    const reconciled = recEl ? !!recEl.checked : false;
    const voided = voidEl ? !!voidEl.checked : false;

    if (!date || !payee) {
      alert('Please fill in at least Date and Payee');
      return;
    }
    if (payment === 0 && deposit === 0) {
      alert('Please enter either a Payment or Deposit amount');
      return;
    }

    const index = this.transactions.findIndex(t => t.id === id);
    if (index === -1) return;

    // preserve checks list unless changed by a more advanced editor
    const checks = this.transactions[index].checks ? [...this.transactions[index].checks] : [];

    this.transactions[index] = {
      ...this.transactions[index],
      date,
      ref,
      type,
      payee,
      class: txClass,
      location,
      payment,
      deposit,
      account,
      memo,
      checks,
      reconciled,
      voided
    };

    this.inlineEditingId = null;
    this.saveToLocalStorage();
    this.renderTable();
    this.updateSummary();
  }

  /** Cancel inline edit and revert view */
  cancelInlineEdit(id) {
    this.inlineEditingId = null;
    this.renderTable();
  }

  /** Escape text (delegates to Utils) */
  escapeHtml(s){ return Utils.escapeHtml(s); }

  /** Return account select options string for the inline editor */
  getAccountOptions(selected){ return this.accountManager.getOptions(selected); }

  deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.transactions = this.transactions.filter(t => t.id !== id);
      this.saveToLocalStorage();
      this.renderTable();
      this.updateSummary();
    }
  }

  /**
   * Reset the add-row inputs and pending checks state to defaults.
   */
  clearForm() {
    this.editingId = null;
    this.newDate.value = Utils.todayISO();
    this.newRef.value = '';
    this.newPayee.value = '';
    this.newClass.value = '';
    this.newLocation.value = '';
    this.newPayment.value = '';
    this.newDeposit.value = '';
    if (this.newAccount) this.newAccount.value = '';
    if (this.newMemo) this.newMemo.value = '';
    if (this.newReconciled) this.newReconciled.checked = false;
    if (this.newVoid) this.newVoid.checked = false;
    this.checkManager.clear();
    this.updateChecksUI();
    this.addBtn.textContent = 'Add';
    if (this.newPayment) this.newPayment.disabled = false;
    if (this.newDeposit) this.newDeposit.disabled = false;
  }

  /**
   * Render the transactions table. Computes a running balance (oldest-first)
   * and displays reconciled/void states and per-row balance.
   */
  renderTable() {
    // Keep the add row and inline group rows at the top
    const addRow = this.tableBody.querySelector('.add-row');
    // try to preserve any existing group rows (either in DOM or from cached refs)
    const groupRow = this.tableBody.querySelector('#groupAddRow') || this.groupAddRow;
    const entryRow = this.tableBody.querySelector('#groupCheckEntryRow') || this.groupCheckEntryRow;

    // clear and reattach preserved rows so toggle handlers can find them
    this.tableBody.innerHTML = '';
    if (addRow) this.tableBody.appendChild(addRow);
    if (groupRow) this.tableBody.appendChild(groupRow);
    if (entryRow) this.tableBody.appendChild(entryRow);

    if (this.transactions.length === 0) {
      return;
    }

    // Compute running balances using oldest-first order
    const asc = [...this.transactions].sort((a, b) => new Date(a.date) - new Date(b.date) || a.id - b.id);
    // Starting balance removed; compute running balance starting at zero
    let balance = 0;
    const balanceMap = {};
    asc.forEach(tx => {
      const payment = tx.voided ? 0 : (tx.payment || 0);
      const deposit = tx.voided ? 0 : (tx.deposit || 0);
      balance = balance + deposit - payment;
      balanceMap[tx.id] = balance;
    });

    // Sort for display (user-controlled via header buttons)
    let sorted;
    if (this.sortState && this.sortState.col) {
      const dir = this.sortState.dir === 'asc' ? 1 : -1;
      sorted = [...this.transactions].sort((a, b) => {
        const get = (obj, key) => {
          switch (key) {
            case 'date': return new Date(obj.date || 0);
            case 'payment': return parseFloat(obj.payment) || 0;
            case 'deposit': return parseFloat(obj.deposit) || 0;
            case 'reconciled': return obj.reconciled ? 1 : 0;
            case 'voided': return obj.voided ? 1 : 0;
            default: return String(obj[key] || '').toLowerCase();
          }
        };
        const va = get(a, this.sortState.col);
        const vb = get(b, this.sortState.col);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
      });
    } else {
      // default: newest first by date
      sorted = [...this.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    sorted.forEach(transaction => {
      const row = document.createElement('tr');
      row.setAttribute('data-tx-id', transaction.id);
      if (transaction.voided) row.classList.add('voided');
      const formattedDate = this.formatDate(transaction.date);
      const formattedPayment = this.formatCurrency(transaction.payment || 0);
      const formattedDeposit = this.formatCurrency(transaction.deposit || 0);
      const formattedBalance = this.formatCurrency(balanceMap[transaction.id] || 0);

      // If this is a group being edited inline, render group editing inputs in the row
      if (transaction.group && this.editingGroupId === transaction.id) {
        const payments = this.groupChecks.reduce((s, c) => s + (c.type === 'Payment' ? (c.amount || 0) : 0), 0);
        const deposits = this.groupChecks.reduce((s, c) => s + (c.type === 'Deposit' ? (c.amount || 0) : 0), 0);
        row.innerHTML = `
          <td data-label="Date"><input type="date" class="inline-input group-inline-date" value="${this.escapeHtml(transaction.date)}"></td>
          <td data-label="Ref / Type">
            <div class="stack">
              <select class="inline-input group-inline-type">
                <option value="">Select type</option>
                <option value="Expenditure" ${transaction.type === 'Expenditure' ? 'selected' : ''}>Expenditure</option>
                <option value="Transaction" ${transaction.type === 'Transaction' ? 'selected' : ''}>Transaction</option>
                <option value="Deposit" ${transaction.type === 'Deposit' ? 'selected' : ''}>Deposit</option>
              </select>
              <div class="muted small">Group</div>
            </div>
          </td>
          <td data-label="Payee / Account">
            <div class="stack"><span>Group</span><span class="muted small">${this.escapeHtml(transaction.account || '')}</span></div>
          </td>
          <td data-label="Class / Location">
            <div class="stack">
              <input type="text" class="inline-input group-inline-class" value="${this.escapeHtml(transaction.class || '')}" placeholder="Class">
              <input type="text" class="inline-input group-inline-location" value="${this.escapeHtml(transaction.location || '')}" placeholder="Location">
            </div>
          </td>
          <td data-label="Payment"><input type="number" step="0.01" class="inline-input group-inline-payment" value="${payments.toFixed(2)}" disabled></td>
          <td data-label="Deposit"><input type="number" step="0.01" class="inline-input group-inline-deposit" value="${deposits.toFixed(2)}" disabled></td>
          <td data-label="Memo"><input type="text" class="inline-input group-inline-memo" value="${this.escapeHtml(transaction.memo || '')}"></td>
          <td data-label="Balance">${formattedBalance}</td>
          <td class="actions" data-label="Actions">
            <button class="btn btn-primary btn-group-save" data-id="${transaction.id}">Save Group</button>
            <button class="btn btn-secondary btn-group-cancel" data-id="${transaction.id}">Cancel</button>
          </td>
        `;
      } else if (this.inlineEditingId === transaction.id) {
        // Inline edit mode — render inputs so user can edit directly
        row.innerHTML = `
          <td data-label="Date"><input type="date" class="inline-input inline-date" value="${this.escapeHtml(transaction.date || '')}"></td>
          <td data-label="Ref / Type">
            <div class="stack">
              <input type="text" class="inline-input inline-ref" value="${this.escapeHtml(transaction.ref || '')}" placeholder="Ref #">
              <select class="inline-input inline-type">
                <option value="">Select type</option>
                <option value="Expenditure" ${transaction.type === 'Expenditure' ? 'selected' : ''}>Expenditure</option>
                <option value="Transaction" ${transaction.type === 'Transaction' ? 'selected' : ''}>Transaction</option>
                <option value="Deposit" ${transaction.type === 'Deposit' ? 'selected' : ''}>Deposit</option>
              </select>
            </div>
          </td>
          <td data-label="Payee / Account">
            <div class="stack">
              <input type="text" class="inline-input inline-payee" value="${this.escapeHtml(transaction.payee || '')}" placeholder="Payee">
              <select class="inline-input inline-account">${this.getAccountOptions(transaction.account)}</select>
            </div>
          </td>
          <td data-label="Class / Location">
            <div class="stack">
              <input type="text" class="inline-input inline-class" value="${this.escapeHtml(transaction.class || '')}" placeholder="Class">
              <input type="text" class="inline-input inline-location" value="${this.escapeHtml(transaction.location || '')}" placeholder="Location">
            </div>
          </td>
          <td data-label="Payment"><input type="number" step="0.01" class="inline-input inline-payment" value="${transaction.payment ? transaction.payment.toFixed(2) : ''}"></td>
          <td data-label="Deposit"><input type="number" step="0.01" class="inline-input inline-deposit" value="${transaction.deposit ? transaction.deposit.toFixed(2) : ''}"></td>
          <td data-label="Memo"><input type="text" class="inline-input inline-memo" value="${this.escapeHtml(transaction.memo || '')}"></td>
          <td data-label="Balance">${formattedBalance}</td>
          <td class="actions" data-label="Actions">
            <label class="inline-toggle"><input type="checkbox" class="inline-reconciled" ${transaction.reconciled ? 'checked' : ''}> Rec</label>
            <label class="inline-toggle" style="margin-left:8px"><input type="checkbox" class="inline-void" ${transaction.voided ? 'checked' : ''}> Void</label>
            <br>
            ${transaction.checks && transaction.checks.length > 0 ? `<button class="toggle-checks-btn" data-id="${transaction.id}" style="margin-left:8px">${this.visibleChecks.has(transaction.id) ? 'Hide checks' : 'Show checks'}</button>` : ''}
            <button class="btn btn-primary btn-inline-save" data-id="${transaction.id}">Save</button>
            <button class="btn btn-secondary btn-inline-cancel" data-id="${transaction.id}">Cancel</button>
          </td>
        `;
      } else {
        // Normal (read-only) display row
        row.innerHTML = `
          <td data-label="Date">${formattedDate}</td>
          <td data-label="Ref / Type">
            <div class="stack"><span>${this.escapeHtml(transaction.ref || '')}</span><span class="muted small">${this.escapeHtml(transaction.type || '')}${transaction.group ? '<br>Group (' + (transaction.checks ? transaction.checks.length : 0) + ')' : ''}</span></div>
          </td>
          <td data-label="Payee / Account">
            <div class="stack"><span>${this.escapeHtml(transaction.payee || '')}</span><span class="muted small">${this.escapeHtml(transaction.account || '')}</span></div>
          </td>
          <td data-label="Class / Location">
            <div class="stack"><span>${this.escapeHtml(transaction.class || '')}</span><span class="muted small">${this.escapeHtml(transaction.location || '')}</span></div>
          </td>
          <td data-label="Payment">${formattedPayment}</td>
          <td data-label="Deposit">${formattedDeposit}</td>
          <td data-label="Memo">${this.escapeHtml(transaction.memo || '')}</td>
          <td data-label="Balance">${formattedBalance}</td>
          <td class="actions" data-label="Actions">
            <label class="inline-toggle"><input type="checkbox" class="reconciled-toggle" data-id="${transaction.id}" ${transaction.reconciled ? 'checked' : ''}> Rec</label>
            <label class="inline-toggle" style="margin-left:8px"><input type="checkbox" class="void-toggle" data-id="${transaction.id}" ${transaction.voided ? 'checked' : ''}> Void</label>
            ${transaction.checks && transaction.checks.length > 0 ? `<button class="toggle-checks-btn" data-id="${transaction.id}" style="margin-left:8px">${this.visibleChecks.has(transaction.id) ? 'Hide checks' : 'Show checks'}</button>` : ''}
            <br>
            <button class="btn btn-edit" data-id="${transaction.id}">Edit</button>
            <button class="btn btn-delete" data-id="${transaction.id}">Delete</button>
          </td>
        `;
      }

      this.tableBody.appendChild(row);

      // If transaction has checks and is a group (or has checks), render a details section as table rows so columns align
      if (this.editingGroupId === transaction.id) {
        // Render each group check as its own row so data aligns under the table columns
        this.groupChecks.forEach((c, i) => {
          const trc = document.createElement('tr');
          trc.classList.add('group-editor-check');
          trc.setAttribute('data-parent-id', transaction.id);
          trc.style.display = 'table-row';
          trc.innerHTML = `
            <td></td>
            <td>${this.escapeHtml(c.refNo || '')} <div class="muted small">${this.escapeHtml(c.type || '')}</div></td>
            <td><div class="stack"><span>${this.escapeHtml(c.payee || '')}</span><span class="muted small">${this.escapeHtml(c.account || '')}</span></div></td>
            <td>${this.escapeHtml(c.class || '')}</td>
            <td>${c.type === 'Payment' ? this.formatCurrency(c.amount || 0) : ''}</td>
            <td>${c.type === 'Deposit' ? this.formatCurrency(c.amount || 0) : ''}</td>
            <td>${this.escapeHtml(c.description || '')} ${c.paymentMethod ? '<br>' + this.escapeHtml(c.paymentMethod) : ''}</td>
            <td></td>
            <td><button class="btn btn-secondary remove-group-check" data-idx="${i}">Remove</button></td>
          `;
          this.tableBody.appendChild(trc);
        });

        // Add a single add-row (with .group-editor-detail so event handlers can find it)
        const addRow = document.createElement('tr');
        addRow.classList.add('group-editor-detail');
        addRow.setAttribute('data-parent-id', transaction.id);
        addRow.style.display = 'table-row';
        addRow.innerHTML = `<td colspan="9">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <input class="inline-input ig-payee" placeholder="Payee">
            <select class="inline-input ig-account">${this.accountManager.getOptions()}</select>
            <input class="inline-input ig-ref" placeholder="Ref #">
            <input class="inline-input ig-amt" placeholder="Payment" type="number" step="0.01">
            <input class="inline-input ig-dep-amt" placeholder="Deposit" type="number" step="0.01">
            <input class="inline-input ig-class" placeholder="Class">
            <input class="inline-input ig-desc" placeholder="Description">
            <input class="inline-input ig-method" placeholder="Method">
            <button class="btn btn-primary inline-add-group-check">Add</button>
            <button class="btn btn-secondary inline-clear-group-checks">Clear</button>
          </div>
        </td>`;
        this.tableBody.appendChild(addRow);
      } else if (transaction.checks && transaction.checks.length > 0) {
        // Show each check as its own row (when visible) so columns line up
        const show = this.visibleChecks.has(transaction.id);
        if (show) {
          transaction.checks.forEach(c => {
            const trc = document.createElement('tr');
            trc.classList.add('checks-detail');
            trc.setAttribute('data-parent-id', transaction.id);
            trc.style.display = 'table-row';
            trc.innerHTML = `
              <td></td>
              <td>${this.escapeHtml(c.refNo || '')} <div class="muted small">${this.escapeHtml(c.type || '')}</div></td>
              <td><div class="stack"><span>${this.escapeHtml(c.payee || c.number || '')}</span><span class="muted small">${this.escapeHtml(c.account || '')}</span></div></td>
              <td>${this.escapeHtml(c.class || '')}</td>
              <td>${c.type === 'Payment' ? this.formatCurrency(c.amount || 0) : ''}</td>
              <td>${c.type === 'Deposit' ? this.formatCurrency(c.amount || 0) : ''}</td>
              <td>${this.escapeHtml(c.description || '')} ${c.paymentMethod ? '<br>' + this.escapeHtml(c.paymentMethod) : ''}</td>
              <td></td>
              <td></td>
            `;
            this.tableBody.appendChild(trc);
          });
        }
      }
    });

    // Update header sort button visuals
    this.updateSortButtons();
  }

  /**
   * Update totals (payments, deposits, net) and compute ending balance
   * considering the Starting Balance and excluding voided transactions.
   */
  updateSummary() {
    const totalPayments = this.transactions.reduce((sum, t) => sum + (t.voided ? 0 : (t.payment || 0)), 0);
    const totalDeposits = this.transactions.reduce((sum, t) => sum + (t.voided ? 0 : (t.deposit || 0)), 0);
    document.getElementById('totalPayments').textContent = this.formatCurrency(totalPayments);
    document.getElementById('totalDeposits').textContent = this.formatCurrency(totalDeposits);

    // Ending balance now computed as deposits - payments (starting balance removed)
    const ending = totalDeposits - totalPayments;
    const endEl = document.getElementById('endingBalance');
    if (endEl) {
      endEl.textContent = this.formatCurrency(ending);
      endEl.style.color = ending >= 0 ? 'var(--success)' : 'var(--error)';
    }
  }

  handleResize() {
    // Toggle a 'compact' class for small screens; CSS will adapt styles
    const compact = window.innerWidth <= 600;
    document.body.classList.toggle('compact', compact);
  }

  /** Update sort button visuals in table headers */
  updateSortButtons() {
    const btns = document.querySelectorAll('.sort-btn');
    btns.forEach(b => {
      const col = b.dataset.col;
      if (!col) return;
      if (this.sortState && this.sortState.col === col) {
        b.classList.add('active');
        b.textContent = this.sortState.dir === 'asc' ? '▲' : '▼';
      } else {
        b.classList.remove('active');
        b.textContent = '↕';
      }
    });
  }

  formatCurrency(amount){ return Utils.formatCurrency(amount); }

  formatDate(dateString){ return Utils.formatDate(dateString); }

  /** Persist transactions through Storage helper */
  saveToLocalStorage() {
    Storage.saveTransactions(this.transactions);
  }

  /** Populate the account select with values from AccountManager. */
  populateAccounts(){
    if (this.newAccount) this.newAccount.innerHTML = this.accountManager.getOptions();
    if (this.grpCheckAccount) this.grpCheckAccount.innerHTML = this.accountManager.getOptions();
  }

  /** Add a check to the pending checks list (UI helper). */
  addCheck() {
    const num = this.checkNumInput.value.trim();
    const amt = parseFloat(this.checkAmtInput.value) || 0;
    if (!num || amt <= 0) {
      alert('Enter check number and positive amount');
      return;
    }
    this.checkManager.add(num, amt);
    this.checkNumInput.value = '';
    this.checkAmtInput.value = '';
    if (this.checksRow) this.checksRow.style.display = 'table-row';
    this.updateChecksUI();
  }

  /** Remove a pending check by index and update UI. */
  removeCheck(idx) {
    this.checkManager.remove(idx);
    this.updateChecksUI();
  }

  /** Update the checks list UI and synchronize deposit field. */
  updateChecksUI() {
    if (!this.checksList) return;
    const list = this.checkManager.list();
    this.checksList.innerHTML = list.map((c, i) => `<li>${c.number} — ${this.formatCurrency(c.amount)} <button class="btn btn-secondary remove-check" data-idx="${i}">Remove</button></li>`).join('');
    // update total
    const sum = this.checkManager.total();
    if (this.checksTotal) this.checksTotal.textContent = this.formatCurrency(sum);
    if (sum > 0) {
      this.newDeposit.value = sum.toFixed(2);
      this.newDeposit.disabled = true;
    } else {
      this.newDeposit.disabled = false;
    }

    // show/hide the small checks toggle link
    if (this.showChecksLink) {
      this.showChecksLink.style.display = (list.length > 0) ? 'inline-block' : 'none';
      this.showChecksLink.textContent = (list.length > 0) ? 'Hide checks' : 'Show checks';
    }
  }

  /** Group form: add a check object to the groupChecks list. If `root` is provided, read inputs from it (inline editor) */
  addGroupCheck(root) {
    let payee, account, desc, method, refNo, amtP, amtD, cls;
    if (root) {
      payee = (root.querySelector('.ig-payee') && root.querySelector('.ig-payee').value.trim()) || '';
      account = (root.querySelector('.ig-account') && root.querySelector('.ig-account').value) || '';
      desc = (root.querySelector('.ig-desc') && root.querySelector('.ig-desc').value.trim()) || '';
      method = (root.querySelector('.ig-method') && root.querySelector('.ig-method').value.trim()) || '';
      refNo = (root.querySelector('.ig-ref') && root.querySelector('.ig-ref').value.trim()) || '';
      amtP = parseFloat(root.querySelector('.ig-amt') ? root.querySelector('.ig-amt').value : 0) || 0;
      amtD = parseFloat(root.querySelector('.ig-dep-amt') ? root.querySelector('.ig-dep-amt').value : 0) || 0;
      cls = (root.querySelector('.ig-class') && root.querySelector('.ig-class').value.trim()) || '';
    } else {
      payee = this.grpCheckPayee.value.trim();
      account = this.grpCheckAccount.value || '';
      desc = this.grpCheckDesc.value.trim();
      method = this.grpCheckMethod.value.trim();
      refNo = this.grpCheckRef.value.trim();
      amtP = parseFloat(this.grpCheckAmt.value) || 0;
      amtD = parseFloat(this.grpCheckDepositAmt.value) || 0;
      cls = this.grpCheckClass.value.trim();
    }

    if (!payee || (amtP <= 0 && amtD <= 0)) {
      alert('Please provide check Payee and a positive Payment or Deposit amount');
      return;
    }
    if (amtP > 0 && amtD > 0) {
      alert('Please enter only one of Payment or Deposit amount per check');
      return;
    }

    const type = amtD > 0 ? 'Deposit' : 'Payment';
    const amount = type === 'Deposit' ? amtD : amtP;

    this.groupChecks.push({ payee, account, description: desc, paymentMethod: method, refNo, type, amount, class: cls });

    // clear inputs
    if (root) {
      if (root.querySelector('.ig-payee')) root.querySelector('.ig-payee').value = '';
      if (root.querySelector('.ig-account')) root.querySelector('.ig-account').value = '';
      if (root.querySelector('.ig-desc')) root.querySelector('.ig-desc').value = '';
      if (root.querySelector('.ig-method')) root.querySelector('.ig-method').value = '';
      if (root.querySelector('.ig-ref')) root.querySelector('.ig-ref').value = '';
      if (root.querySelector('.ig-amt')) root.querySelector('.ig-amt').value = '';
      if (root.querySelector('.ig-dep-amt')) root.querySelector('.ig-dep-amt').value = '';
      if (root.querySelector('.ig-class')) root.querySelector('.ig-class').value = '';
    } else {
      this.grpCheckPayee.value = '';
      this.grpCheckAccount.value = '';
      this.grpCheckDesc.value = '';
      this.grpCheckMethod.value = '';
      this.grpCheckRef.value = '';
      this.grpCheckAmt.value = '';
      this.grpCheckDepositAmt.value = '';
      this.grpCheckClass.value = '';
    }

    if (this.editingGroupId) this.renderTable(); else this.updateGroupChecksUI();
  }

  removeGroupCheck(idx) {
    if (idx >= 0 && idx < this.groupChecks.length) this.groupChecks.splice(idx, 1);
    if (this.editingGroupId) this.renderTable(); else this.updateGroupChecksUI();
  }

  updateGroupChecksUI() {
    // remove existing inline group-check rows
    const existing = Array.from(this.tableBody.querySelectorAll('tr.group-check-row'));
    existing.forEach(r => r.remove());

    // find insertion point (after groupCheckEntryRow)
    const entryRow = this.tableBody.querySelector('#groupCheckEntryRow');
    if (!entryRow) return;

    // insert a row per check aligned to table columns
    this.groupChecks.forEach((c, i) => {
      const tr = document.createElement('tr');
      tr.classList.add('group-check-row');
      tr.setAttribute('data-idx', i);

      const payee = this.escapeHtml(c.payee || '');
      const acc = this.escapeHtml(c.account || '');
      const desc = this.escapeHtml(c.description || '');
      const method = this.escapeHtml(c.paymentMethod || '');
      const refNo = this.escapeHtml(c.refNo || '');
      const cls = this.escapeHtml(c.class || '');
      const type = this.escapeHtml(c.type || '');
      const num = this.escapeHtml(c.number || '');
      const amount = this.formatCurrency(c.amount || 0);

      tr.innerHTML = `
        <td></td>
        <td data-label="Ref">${refNo}</td>
        <td data-label="Payee / Account"><div class="stack"><span>${payee}</span><span class="muted small">${acc}</span></div></td>
        <td data-label="Class">${cls}</td>
        <td data-label="Payment">${type === 'Payment' ? amount : ''}</td>
        <td data-label="Deposit">${type === 'Deposit' ? amount : ''}</td>
        <td data-label="Memo">${desc} ${method ? '<br>' + method : ''}</td>
        <td data-label="Balance"></td>
        <td><button class="btn btn-secondary remove-group-check" data-idx="${i}">Remove</button></td>
      `;

      entryRow.before(tr);
    });

    const payments = this.groupChecks.reduce((s, c) => s + (c.type === 'Payment' ? (c.amount || 0) : 0), 0);
    const deposits = this.groupChecks.reduce((s, c) => s + (c.type === 'Deposit' ? (c.amount || 0) : 0), 0);
    if (this.groupPayment) this.groupPayment.value = payments.toFixed(2);
    if (this.groupDeposit) this.groupDeposit.value = deposits.toFixed(2);
    if (this.groupChecksTotal) this.groupChecksTotal.textContent = this.formatCurrency(payments + deposits);
  }

  /** Handle adding a group transaction (validates and persists checks + group metadata) */
  handleAddGroup() {
    const date = this.groupDate.value;
    const type = this.groupType.value || '';
    const location = this.groupLocation.value.trim();
    const memo = this.groupMemo ? this.groupMemo.value.trim() : '';

    if (!date) {
      alert('Please provide a Date for the group');
      return;
    }

    if (!this.groupChecks || this.groupChecks.length === 0) {
      alert('Please add at least one check to the group');
      return;
    }

    const payments = this.groupChecks.reduce((s, c) => s + (c.type === 'Payment' ? (c.amount || 0) : 0), 0);
    const deposits = this.groupChecks.reduce((s, c) => s + (c.type === 'Deposit' ? (c.amount || 0) : 0), 0);

    const transaction = {
      id: this.editingGroupId || Date.now(),
      date,
      check: '',
      type,
      ref: '',
      payee: 'Group',
      class: '',
      location,
      payment: payments,
      deposit: deposits,
      account: '',
      memo,
      checks: [...this.groupChecks],
      reconciled: false,
      voided: false,
      group: true
    };

    if (this.editingGroupId) {
      const idx = this.transactions.findIndex(t => t.id === this.editingGroupId);
      if (idx !== -1) this.transactions[idx] = transaction;
      this.editingGroupId = null;
      this.addGroupBtn.textContent = 'Add Group';
    } else {
      this.transactions.unshift(transaction);
    }

    this.groupChecks = [];
    this.updateGroupChecksUI();
    this.saveToLocalStorage();
    this.renderTable();
    this.updateSummary();
    // when saving a group (add or edit) keep the single-entry add-row hidden
    this.cancelGroup(false);
  }

  populateGroupAccountOptions(){ if (!this.grpCheckAccount) return; this.grpCheckAccount.innerHTML = this.accountManager.getOptions(); }

  cancelGroup(showAddRow = true) {
    // hide inline rows & reset
    const groupRow = document.getElementById('groupAddRow');
    const entryRow = document.getElementById('groupCheckEntryRow');
    if (groupRow) groupRow.style.display = 'none';
    if (entryRow) entryRow.style.display = 'none';
    if (this.toggleGroupBtn) this.toggleGroupBtn.textContent = 'New Group';
    this.editingGroupId = null;
    this.groupChecks = [];
    this.updateGroupChecksUI();

    // optionally show the main add-row (only for standalone group cancel/save)
    if (showAddRow) {
      const addRow = this.tableBody.querySelector('.add-row');
      if (addRow) addRow.style.display = 'table-row';
      if (this.toggleEntryBtn) this.toggleEntryBtn.textContent = 'New Entry';
    }

    // clear fields
    if (this.groupDate) this.groupDate.value = Utils.todayISO();
    if (this.groupType) this.groupType.value = '';
    if (this.groupMemo) this.groupMemo.value = '';
    if (this.groupLocation) this.groupLocation.value = '';
    if (this.grpCheckAmt) { this.grpCheckAmt.value = ''; this.grpCheckAmt.disabled = false; }
    if (this.grpCheckDepositAmt) { this.grpCheckDepositAmt.value = ''; this.grpCheckDepositAmt.disabled = false; }
  }

  /** Start editing a group transaction inline (placed under the transaction row) */
  startGroupEdit(id) {
    const tx = this.transactions.find(t => t.id === id);
    if (!tx) return;
    this.editingGroupId = id;

    // hide the standalone group form rows if present - we'll render inline instead
    const groupRow = document.getElementById('groupAddRow');
    const entryRow = document.getElementById('groupCheckEntryRow');
    if (groupRow) groupRow.style.display = 'none';
    if (entryRow) entryRow.style.display = 'none';

    if (this.toggleGroupBtn) this.toggleGroupBtn.textContent = 'Hide Group';
    // hide add-row to keep forms exclusive
    const addRow = this.tableBody.querySelector('.add-row');
    if (addRow) addRow.style.display = 'none';
    if (this.toggleEntryBtn) this.toggleEntryBtn.textContent = 'New Entry';

    // copy transaction data into inline editing state
    this.populateGroupAccountOptions();
    this.groupChecks = tx.checks ? [...tx.checks] : [];

    // re-render table to show inline group editor
    this.renderTable();
    this.addGroupBtn.textContent = 'Update Group';
  }

  /** Save edits made in the group form back to the transaction */
  saveGroupEdit() {
    // delegates to handleAddGroup which handles editing state as well
    this.handleAddGroup();
  }

  /** Save edits made in the inline group editor (row replacement) */
  saveGroupEditInline(id) {
    const row = this.tableBody.querySelector(`tr[data-tx-id="${id}"]`);
    if (!row) return;
    const date = (row.querySelector('.group-inline-date') && row.querySelector('.group-inline-date').value) || '';
    const type = (row.querySelector('.group-inline-type') && row.querySelector('.group-inline-type').value) || '';
    const location = (row.querySelector('.group-inline-location') && row.querySelector('.group-inline-location').value.trim()) || '';
    const memo = (row.querySelector('.group-inline-memo') && row.querySelector('.group-inline-memo').value.trim()) || '';

    if (!date) { alert('Please provide a Date for the group'); return; }
    if (!this.groupChecks || this.groupChecks.length === 0) { alert('Please add at least one check to the group'); return; }

    const payments = this.groupChecks.reduce((s, c) => s + (c.type === 'Payment' ? (c.amount || 0) : 0), 0);
    const deposits = this.groupChecks.reduce((s, c) => s + (c.type === 'Deposit' ? (c.amount || 0) : 0), 0);

    const transaction = {
      id,
      date,
      check: '',
      type,
      ref: '',
      payee: 'Group',
      class: '',
      location,
      payment: payments,
      deposit: deposits,
      account: '',
      memo,
      checks: [...this.groupChecks],
      reconciled: false,
      voided: false,
      group: true
    };

    const idx = this.transactions.findIndex(t => t.id === id);
    if (idx !== -1) this.transactions[idx] = transaction;

    this.saveToLocalStorage();
    // exit inline group edit mode and reset temporary state
    this.editingGroupId = null;
    this.groupChecks = [];
    if (this.addGroupBtn) this.addGroupBtn.textContent = 'Add Group';
    this.renderTable();
    this.updateSummary();

    // clear inline editing state and restore group UI (do not show add-row)
    this.cancelGroup(false);
  }

  /** Cancel inline group editing */
  cancelGroupInline(id) {
    // reuse cancelGroup to restore UI but keep the add-row hidden
    this.cancelGroup(false);
    // re-render table to ensure view is up-to-date
    this.renderTable();
  }

  toggleVoid(id, checked) {
    const tx = this.transactions.find(t => t.id === id);
    if (!tx) return;
    tx.voided = !!checked;
    this.saveToLocalStorage();
    this.renderTable();
    this.updateSummary();
  }

  /** Persist starting balance via Storage helper. */
  saveStartingBalance() {
    if (!this.startingBalanceInput) return;
    const v = parseFloat(this.startingBalanceInput.value) || 0;
    Storage.saveStartingBalance(v);
  }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new FinancialManager();
});


