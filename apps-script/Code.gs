/**
 * STIZ · Setup Clément : backend gratuit (Google Sheets + Apps Script).
 *
 * La page web lit l'état avec GET et enregistre chaque case ou réponse avec POST.
 * Chaque ligne de l'onglet "state" = une action (steps/s1…s9) ou une décision (decisions/d1…d7).
 *
 * Le jeton évite les écritures de robots au hasard. Il est visible dans la page publique :
 * ce n'est pas une protection forte, d'où la règle "aucun secret dans ces données".
 */

const TOKEN = '928a474bd71801084ded637f';
const SHEET_NAME = 'state';
const HEADERS = ['collection', 'id', 'résumé', 'json', 'mis à jour'];
const COLLECTIONS = ['steps', 'decisions'];
const ID_RE = /^[sd]\d{1,2}$/;
const MAX_JSON = 5000;
const SECRET_RE = /(sk_(live|test)_|rk_(live|test)_|pk_live_|ghp_|gho_|github_pat_|xox[bap]-|AKIA[0-9A-Z]{12}|eyJ[A-Za-z0-9_-]{15,}|service_role|-----BEGIN|password|mot de passe\s*:)/i;

function doGet(e) {
  if (!e || !e.parameter || e.parameter.token !== TOKEN) return json_({ ok: false, error: 'forbidden' });
  const state = { steps: {}, decisions: {} };
  rows_().forEach(function (r) {
    if (COLLECTIONS.indexOf(r.col) === -1) return;
    try { state[r.col][r.id] = JSON.parse(r.json); } catch (err) { /* ligne abîmée : ignorée */ }
  });
  return json_({ ok: true, state: state });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_json' }); }
  if (body.token !== TOKEN) return json_({ ok: false, error: 'forbidden' });
  if (COLLECTIONS.indexOf(body.col) === -1 || !ID_RE.test(String(body.id))) return json_({ ok: false, error: 'bad_path' });

  const raw = body.data === null ? null : JSON.stringify(body.data);
  if (raw && raw.length > MAX_JSON) return json_({ ok: false, error: 'too_large' });
  if (raw && SECRET_RE.test(raw)) return json_({ ok: false, error: 'looks_like_secret' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = sheet_();
    const rows = rows_();
    const hit = rows.filter(function (r) { return r.col === body.col && r.id === body.id; })[0];
    if (raw === null) {
      if (hit) sheet.deleteRow(hit.row);
    } else {
      const values = [[body.col, body.id, summary_(body.col, body.data), raw, new Date()]];
      if (hit) sheet.getRange(hit.row, 1, 1, HEADERS.length).setValues(values);
      else sheet.appendRow(values[0]);
    }
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

/* Une colonne lisible pour Clément quand il ouvre le Sheet. */
function summary_(col, data) {
  if (col === 'decisions') return data.value || '';
  const parts = [data.done ? '✓ fait' : '· à faire'];
  const fields = data.fields || {};
  Object.keys(fields).forEach(function (k) { if (fields[k]) parts.push(k + ' : ' + fields[k]); });
  return parts.join(' | ');
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function rows_() {
  const sheet = sheet_();
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, HEADERS.length).getValues().map(function (v, i) {
    return { row: i + 2, col: String(v[0]), id: String(v[1]), json: String(v[3]) };
  });
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
