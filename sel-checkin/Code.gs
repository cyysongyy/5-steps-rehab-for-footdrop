/**
 * SEL 情緒簽到 — Google Apps Script 後端
 * 部署：Google Sheets → 擴充功能 → Apps Script → 貼上本檔
 *      → 專案設定 → 指令碼屬性 新增 TEACHER_PASSCODE（教師密碼）
 *      → 部署 → 新增部署 → 網頁應用程式 → 執行身分：我；存取：任何人 → 複製網址
 *
 * 工作表（首次執行自動建立）：
 *   Checkins  : id, 時間, 日期, 班級, 座號, 姓名, 顏色, 情緒, 備註
 *   Roster    : 班級（例：3甲）, 座號, 姓名  ← 名單放這裡，用 RosterSeed.gs 一次匯入
 *   Followups : 時間, 日期, 班級, 座號, 姓名, 狀態, 處遇紀錄, 教師
 */
var COLORS = ['red', 'blue', 'yellow', 'green'];
var SHEETS = {
  Checkins: ['id', '時間', '日期', '班級', '座號', '姓名', '顏色', '情緒', '備註'],
  Roster: ['班級', '座號', '姓名'],
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
function authed_(pass) {
  var p = PropertiesService.getScriptProperties().getProperty('TEACHER_PASSCODE');
  return !!p && String(pass) === String(p);
}
function str_(v, max) { return String(v == null ? '' : v).slice(0, max || 100); }
function dateStr_(v) {
  return v instanceof Date ? Utilities.formatDate(v, 'Asia/Taipei', 'yyyy-MM-dd') : String(v);
}

function doGet(e) {
  var p = e.parameter, a = p.action;
  try {
    if (a === 'ping') return out_({ ok: true });
    // 學生端：僅提供座號與姓名供確認身分
    if (a === 'roster') {
      var list = rows_('Roster').filter(function (r) { return String(r['班級']) === String(p.cls); })
        .map(function (r) { return { seat: Number(r['座號']), name: r['姓名'] }; });
      // 只回傳今天已簽到的座號（不含顏色），讓班級圖卡顯示 ✓
      var d0 = today_();
      var done = rows_('Checkins').filter(function (r) {
        return String(r['班級']) === String(p.cls) && dateStr_(r['日期']) === d0;
      }).map(function (r) { return Number(r['座號']); });
      return out_({ ok: true, roster: list, done: done });
    }
    // 以下為教師端
    if (!authed_(p.pass)) return out_({ ok: false, error: 'auth' });
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
    if (!authed_(b.pass)) return out_({ ok: false, error: 'auth' });
    if (a === 'saveRoster') {
      var sh = sheet_('Roster');
      var all = sh.getDataRange().getValues();
      for (var i = all.length - 1; i >= 1; i--) if (String(all[i][0]) === String(b.cls)) sh.deleteRow(i + 1);
      (b.roster || []).forEach(function (r) { sh.appendRow([str_(b.cls, 10), Number(r.seat), str_(r.name, 20)]); });
      return out_({ ok: true });
    }
    if (a === 'followup') {
      sheet_('Followups').appendRow([now_(), today_(), str_(b.cls, 10), Number(b.seat), str_(b.name, 20),
        str_(b.status, 20), str_(b.note, 500), str_(b.teacher, 20)]);
      return out_({ ok: true });
    }
    return out_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
