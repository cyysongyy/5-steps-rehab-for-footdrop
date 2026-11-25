/**
 * SEL 情緒簽到 — Google Apps Script 後端
 * 部署：Google Sheets → 擴充功能 → Apps Script → 貼上本檔
 *      → 專案設定 → 指令碼屬性 新增 PRINCIPAL_PASSCODE（校長密碼，可看全校）
 *      → 試算表 Teachers 分頁：每班一列「班級（例：3甲）、教師、密碼」，老師只看得到自己的班
 *      → 部署 → 新增部署 → 網頁應用程式 → 執行身分：我；存取：任何人 → 複製網址
 *
 * 工作表（首次執行自動建立）：
 *   Checkins  : id, 時間, 日期, 班級, 座號, 姓名, 顏色, 情緒, 備註
 *   Roster    : 班級（例：3甲）, 座號, 姓名  ← 名單放這裡，用 RosterSeed.gs 一次匯入
 *   Teachers  : 班級, 教師, 密碼   ← 老師登入用；同一位老師帶多班就多列、用同一組密碼
 *   Followups : 時間, 日期, 班級, 座號, 姓名, 狀態, 處遇紀錄, 教師
 */
var COLORS = ['red', 'blue', 'yellow', 'green'];
var SHEETS = {
  Checkins: ['id', '時間', '日期', '班級', '座號', '姓名', '顏色', '情緒', '備註'],
  Roster: ['班級', '座號', '姓名'],
  Teachers: ['班級', '教師', '密碼'],
  Followups: ['時間', '日期', '班級', '座號', '姓名', '狀態', '處遇紀錄', '教師']
};

function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(SHEETS[name]);
    sh.setFrozenRows(1);
  }
  return sh;
}
function rows_(name) {
  var v = sheet_(name).getDataRange().getValues();
  var head = v.shift();
  return v.map(function (r) {
    var o = {};
    head.forEach(function (h, i) { o[h] = r[i]; });
    return o;
  });
}
function today_() { return Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd'); }
function now_() { return Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss'); }
function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
// 權限：校長密碼（指令碼屬性 PRINCIPAL_PASSCODE）可看全校；教師密碼（Teachers 分頁）只能看自己的班
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k); }
function isPrincipal_(pass) { var p = prop_('PRINCIPAL_PASSCODE'); return !!p && String(pass) === String(p); }
function access_(pass) {
  pass = String(pass == null ? '' : pass);
  if (!pass) return null;
  if (isPrincipal_(pass)) return { role: 'principal', name: '校長', classes: null };
  var mine = rows_('Teachers').filter(function (r) { return String(r['密碼']) === pass; });
  if (!mine.length) return null;
  return { role: 'teacher', name: String(mine[0]['教師']), classes: mine.map(function (r) { return String(r['班級']); }) };
}
function can_(acc, cls) {
  return !!acc && (acc.role === 'principal' || acc.classes.indexOf(String(cls)) >= 0);
}
function allClasses_() {
  var seen = {}, out = [];
  rows_('Roster').forEach(function (r) { var c = String(r['班級']); if (!seen[c]) { seen[c] = 1; out.push(c); } });
  return out.sort();
}
function str_(v, max) { return String(v == null ? '' : v).slice(0, max || 100); }
function dateStr_(v) {
  return v instanceof Date ? Utilities.formatDate(v, 'Asia/Taipei', 'yyyy-MM-dd') : String(v);
}

function doGet(e) {
  var p = e.parameter, a = p.action;
  try {
    if (a === 'ping') return out_({ ok: true });
    // 學生端：只提供座號（不含姓名），姓名僅後端與校長/教師可見
    if (a === 'roster') {
      var list = rows_('Roster').filter(function (r) { return String(r['班級']) === String(p.cls); })
              .map(function (r) { return { seat: Number(r['座號']) }; });
      // 只回傳今天已簽到的座號（不含顏色），讓班級圖卡顯示 ✓
      var d0 = today_();
      var done = rows_('Checkins').filter(function (r) {
        return String(r['班級']) === String(p.cls) && dateStr_(r['日期']) === d0;
      }).map(function (r) { return Number(r['座號']); });
      return out_({ ok: true, roster: list, done: done });
    }
    // 校長總控台：全校總覽（含姓名）
    if (a === 'overview') {
      if (!isPrincipal_(p.pass)) return out_({ ok: false, error: 'auth' });
      return out_(overview_(p.date || today_()));
    }
    // 以下為教師端（只能看自己的班）
    var acc = access_(p.pass);
    if (!acc) return out_({ ok: false, error: 'auth' });
    if (a === 'login') {
      return out_({ ok: true, role: acc.role, name: acc.name, classes: acc.classes || allClasses_() });
    }
    if (!can_(acc, p.cls)) return out_({ ok: false, error: 'forbidden' });
    if (a === 'today') {
      var d = p.date || today_();
      var cl = rows_('Checkins').filter(function (r) {
        return String(r['班級']) === String(p.cls) && dateStr_(r['日期']) === d;
      }).map(function (r) {
        return { id: r.id, time: String(r['時間']), seat: Number(r['座號']), name: r['姓名'],
                 color: r['顏色'], emotion: r['情緒'], note: r['備註'] };
      });
      var fu = rows_('Followups').filter(function (r) {
        return String(r['班級']) === String(p.cls) && dateStr_(r['日期']) === d;
      }).map(function (r) {
        return { time: String(r['時間']), seat: Number(r['座號']), status: r['狀態'], note: r['處遇紀錄'], teacher: r['教師'] };
      });
      return out_({ ok: true, date: d, checkins: cl, followups: fu, roster: rosterOf_(p.cls) });
    }
    if (a === 'history') {
      var limit = new Date(); limit.setDate(limit.getDate() - (Number(p.days) || 14));
      var lim = Utilities.formatDate(limit, 'Asia/Taipei', 'yyyy-MM-dd');
      var h = rows_('Checkins').filter(function (r) {
        return String(r['班級']) === String(p.cls) && Number(r['座號']) === Number(p.seat) && dateStr_(r['日期']) >= lim;
      }).map(function (r) {
        return { date: dateStr_(r['日期']), time: String(r['時間']), color: r['顏色'], emotion: r['情緒'], note: r['備註'] };
      });
      var f = rows_('Followups').filter(function (r) {
        return String(r['班級']) === String(p.cls) && Number(r['座號']) === Number(p.seat);
      }).map(function (r) {
        return { time: String(r['時間']), status: r['狀態'], note: r['處遇紀錄'], teacher: r['教師'] };
      });
      return out_({ ok: true, history: h, followups: f });
    }
    return out_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

// 全校總覽：每班名單 + 當日每位學生最新一筆簽到 + 處遇
function overview_(d) {
  var classes = {}, order = [];
  rows_('Roster').forEach(function (r) {
    var c = String(r['班級']);
    if (!classes[c]) { classes[c] = { cls: c, students: {} }; order.push(c); }
    classes[c].students[Number(r['座號'])] = { seat: Number(r['座號']), name: r['姓名'] };
  });
  rows_('Checkins').forEach(function (r) {
    if (dateStr_(r['日期']) !== d) return;
    var c = String(r['班級']), s = Number(r['座號']);
    if (!classes[c]) { classes[c] = { cls: c, students: {} }; order.push(c); }
    var st = classes[c].students[s] || (classes[c].students[s] = { seat: s, name: r['姓名'] });
    if (!st.time || String(r['時間']) >= st.time) {
      st.time = String(r['時間']); st.color = r['顏色']; st.emotion = r['情緒']; st.note = r['備註'];
    }
  });
  rows_('Followups').forEach(function (r) {
    if (dateStr_(r['日期']) !== d) return;
    var c = String(r['班級']), s = Number(r['座號']);
    if (classes[c] && classes[c].students[s]) classes[c].students[s].fu = { status: r['狀態'], note: r['處遇紀錄'], teacher: r['教師'] };
  });
  order.sort();
  return {
    ok: true, date: d,
    classes: order.map(function (c) {
      var list = Object.keys(classes[c].students).map(Number).sort(function (a, b) { return a - b; })
        .map(function (k) { return classes[c].students[k]; });
      return { cls: c, students: list };
    })
  };
}

function rosterOf_(cls) {
  return rows_('Roster').filter(function (r) { return String(r['班級']) === String(cls); })
    .map(function (r) { return { seat: Number(r['座號']), name: r['姓名'] }; });
}

// 前端以 text/plain 傳 JSON，避免 CORS 預檢
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var b = JSON.parse(e.postData.contents), a = b.action;
    if (a === 'checkin') {
      if (COLORS.indexOf(b.color) < 0) return out_({ ok: false, error: 'bad color' });
      var cls = str_(b.cls, 10), seat = Number(b.seat);
      var me = rosterOf_(cls).filter(function (r) { return r.seat === seat; })[0];
      var name = me ? me.name : str_(b.name, 20);
      sheet_('Checkins').appendRow([Utilities.getUuid(), now_(), today_(), cls, seat, name,
        b.color, str_(b.emotion, 30), str_(b.note, 200)]);
      return out_({ ok: true });
    }
    var acc = access_(b.pass);
    if (!acc) return out_({ ok: false, error: 'auth' });
    if (!can_(acc, b.cls)) return out_({ ok: false, error: 'forbidden' });
    if (a === 'saveRoster') {
      var sh = sheet_('Roster');
      var all = sh.getDataRange().getValues();
      for (var i = all.length - 1; i >= 1; i--) if (String(all[i][0]) === String(b.cls)) sh.deleteRow(i + 1);
      (b.roster || []).forEach(function (r) { sh.appendRow([str_(b.cls, 10), Number(r.seat), str_(r.name, 20)]); });
      return out_({ ok: true });
    }
    if (a === 'followup') {
      sheet_('Followups').appendRow([now_(), today_(), str_(b.cls, 10), Number(b.seat), str_(b.name, 20),
        str_(b.status, 20), str_(b.note, 500), str_(b.teacher || acc.name, 20)]);
      return out_({ ok: true });
    }
    return out_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
