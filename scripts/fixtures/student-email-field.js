// Fixed-domain Ensign student email field. Pattern: docs/patterns/student-email-field.md
// Pure normalizer plus a small DOM controller. Fictional data only.

export const ENSIGN_DOMAIN = 'ensign.edu';

// Returns { ok: true, username, email } or { ok: false, error }.
// Trims outer whitespace and lowercases. Accepts a bare username or a full @ensign.edu address.
// Never converts a foreign-domain address and never rewrites the username's spelling.
export function normalizeStudentEmail(raw) {
  const value = String(raw ?? '').trim().toLowerCase();
  if (!value) return { ok: false, error: 'Enter the student username.' };
  if (/\s/.test(value)) return { ok: false, error: 'Remove the space. A username has no spaces.' };
  const parts = value.split('@');
  if (parts.length > 2) return { ok: false, error: 'Use one @ sign at most.' };
  let username = parts[0];
  if (parts.length === 2) {
    if (parts[1] !== ENSIGN_DOMAIN) {
      return { ok: false, error: `Only @${ENSIGN_DOMAIN} student addresses work here.` };
    }
  }
  if (!username) return { ok: false, error: 'Enter the part before @ensign.edu.' };
  return { ok: true, username, email: `${username}@${ENSIGN_DOMAIN}` };
}

// Wires one field group. lookup(email) returns a Promise with the result for that exact email.
// render(result) shows a result. Every edit hides old results at once, and a response for an
// older request is dropped, so one student's input never sits above another student's results.
export function bindStudentEmailField({ form, input, error, results, status, lookup, render }) {
  let generation = 0;

  const showError = (msg) => {
    error.textContent = msg;
    error.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  };
  const clearError = () => {
    error.textContent = '';
    error.hidden = true;
    input.removeAttribute('aria-invalid');
  };
  const invalidate = () => {
    generation += 1;
    results.hidden = true;
    results.replaceChildren();
    status.textContent = '';
  };

  // Pasting a full Ensign address keeps only the username, so the suffix is never doubled.
  input.addEventListener('paste', (e) => {
    const text = e.clipboardData?.getData('text') ?? '';
    const n = normalizeStudentEmail(text);
    if (n.ok && text.includes('@')) {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: t, value } = input;
      input.value = (s === 0 && t === value.length) || !value ? n.username : value.slice(0, s) + n.username + value.slice(t);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  input.addEventListener('input', () => { invalidate(); clearError(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    invalidate();
    const n = normalizeStudentEmail(input.value);
    if (!n.ok) { showError(n.error); input.focus(); return; }
    clearError();
    const mine = generation;
    status.textContent = `Looking up ${n.email}.`;
    let result;
    try {
      result = await lookup(n.email);
    } catch {
      if (mine === generation) status.textContent = `Lookup failed for ${n.email}. Try again.`;
      return;
    }
    if (mine !== generation) return; // identity changed while waiting: drop the stale response
    results.replaceChildren(render(result, n.email));
    results.hidden = false;
    results.dataset.email = n.email;
    status.textContent = `Showing results for ${n.email}.`;
  });

  return { invalidate, get generation() { return generation; } };
}
