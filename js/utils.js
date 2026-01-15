/* Shared UI and formatting helpers */
const Utils = {
  escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); },
  formatCurrency(n){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n||0); },
  formatDate(s){ if(!s) return ''; const ymd = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/); let d; if(ymd) d = new Date(parseInt(ymd[1],10),parseInt(ymd[2],10)-1,parseInt(ymd[3],10)); else d = new Date(s); return d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); },
  todayISO(){ return new Date().toISOString().split('T')[0]; },
  buildOptions(arr, selected){ const opts = ['<option value="">Select Account</option>']; return opts.concat(arr.map(a=>`<option value="${Utils.escapeHtml(a)}" ${a===selected? 'selected':''}>${Utils.escapeHtml(a)}</option>`)).join(''); }
};
