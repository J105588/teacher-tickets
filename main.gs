// スプレッドシートID
const SHEET_ID_SEATS = '164pnCFDZKmrHlwU0J857NzxRHBeFgdKLzxCwM7DKZmo';
const SHEET_ID_LOG   = '16ADG2Aniz6f_rbirpfngeLXh8D2Im2BA8uJotY394oU';
const SPREADSHEET_ID_KEY = '17w2V9kudoj_EAYUn-gsOG6PhH-_ComyWT6LTnWMXazg';
const KEY_SHEET_NAME = 'keys';

// 申込〆切
const PARENT_APP_DEADLINE = new Date("2025-09-15T00:00:00+09:00"); 

// 「ParentApplications」（ログ用）シート初期化関数
function initializeLogSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID_LOG);
  const sheet = ss.getSheetByName('ParentApplications') || ss.insertSheet('ParentApplications');
  sheet.clear();
  sheet.appendRow(['タイムスタンプ', 'クラス', '氏名', 'メール', '座席リスト']);
}

// 締切日時（ミリ秒）を取得
function getDeadlineTimestamp() {
  return PARENT_APP_DEADLINE.getTime();
}

// 全座席状態を取得
function getAllSeats() {
  const sheet = SpreadsheetApp.openById(SHEET_ID_SEATS).getSheetByName("Seats");
  const data = sheet.getDataRange().getValues().slice(1); // 1行目はヘッダー
  return data.map(r => ({
    row: r[0],
    col: Number(r[1]),
    status: r[2]
  }));
}

/**
 * 申込時：複数座席を一括確保＆ログ記録
 * @param {string|number} classNo - クラス番号
 * @param {string} name - 氏名
 * @param {string} mail - メールアドレス
 * @param {Array<{row:string, col:number}>} selectedSeatsArr - 申込座席リスト [{row:..., col:...}, ...]
 */
function submitMultipleSeats(classNo, name, mail, selectedSeatsArr) {
  // 座席確保
  const sheetSeats = SpreadsheetApp.openById(SHEET_ID_SEATS).getSheetByName("Seats");
  const allRows = sheetSeats.getDataRange().getValues();
  let seatResults = [];
  selectedSeatsArr.forEach(sel => {
    for (let i = 1; i < allRows.length; i++) { // i=1はヘッダ除外
      if (allRows[i][0] == sel.row && Number(allRows[i][1]) == Number(sel.col)) {
        if (allRows[i][2] !== "確保") {
          sheetSeats.getRange(i+1, 3).setValue("確保");
          sheetSeats.getRange(i+1, 4).setValue(name);
          seatResults.push(sel.row + "-" + sel.col + "：OK");
        } else {
          seatResults.push(sel.row + "-" + sel.col + "：既に確保済");
        }
        break;
      }
    }
  });

  // 応募ログ記録
  const logSheet = SpreadsheetApp.openById(SHEET_ID_LOG).getSheetByName("ParentApplications")
    || SpreadsheetApp.openById(SHEET_ID_LOG).insertSheet("ParentApplications");
  // ヘッダなければ追加（初回対応）
  if (logSheet.getLastRow() === 0) {
    logSheet.appendRow(['タイムスタンプ', 'クラス', '氏名', 'メール', '座席リスト']);
  }
  logSheet.appendRow([
    new Date(),
    classNo,
    name,
    mail,
    selectedSeatsArr.map(s => s.row + "-" + s.col).join(","),
  ]);
  return "以下の座席を確保しました：\n" + seatResults.join("\n");
}

function isValidKey(key) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID_KEY).getSheetByName(KEY_SHEET_NAME);
  var keys = sheet.getDataRange().getValues().flat();
  return keys.includes(key);
}

function validateLicense() {
  const LICENSE_KEY = '3YM,Iqb?v2L6';
  if (!isValidKey(LICENSE_KEY)) {
    throw new Error('このライセンスキーは無効です。');
  }
  return true;
}

// Web公開用
function doGet(e) {
  // JSONP エンドポイント (callback, func, params が指定された場合)
  if (e && e.parameter && e.parameter.callback && e.parameter.func) {
    var callback = e.parameter.callback;
    var func = e.parameter.func;
    var paramsJson = e.parameter.params || '[]';
    var params;
    try {
      params = JSON.parse(paramsJson);
      if (!Array.isArray(params)) params = [params];
    } catch (err) {
      var errorBody = callback + '(' + JSON.stringify({ success: false, error: 'Invalid params JSON', detail: String(err) }) + ');';
      return ContentService.createTextOutput(errorBody).setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    try {
      var result;
      switch (func) {
        case 'getDeadlineTimestamp':
          result = getDeadlineTimestamp();
          break;
        case 'getAllSeats':
          result = getAllSeats();
          break;
        case 'submitMultipleSeats':
          // 互換: 旧API (固定シート) 用。params: [classNo, name, mail, selectedSeatsArr]
          result = submitMultipleSeats.apply(null, params);
          break;
        case 'getAllTimeslotsForGroup':
          // params: [group]
          result = getAllTimeslotsForGroup.apply(null, params);
          break;
        case 'getSeatData':
          // params: [group, day, timeslot, isAdmin]
          result = getSeatData.apply(null, params);
          break;
        case 'submitSelectedSeats':
          // params: [group, day, timeslot, classNo, name, mail, selectedSeatsArr]
          result = submitSelectedSeats.apply(null, params);
          break;
        case 'validateLicense':
          result = validateLicense();
          break;
        case 'testApi':
          result = { ping: 'pong', now: new Date().toISOString() };
          break;
        default:
          throw new Error('Unknown function: ' + func);
      }

      var successBody = callback + '(' + JSON.stringify({ success: true, data: result }) + ');';
      return ContentService.createTextOutput(successBody).setMimeType(ContentService.MimeType.JAVASCRIPT);
    } catch (err2) {
      var failBody = callback + '(' + JSON.stringify({ success: false, error: String(err2) }) + ');';
      return ContentService.createTextOutput(failBody).setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
  }

  // ヘルスチェック/プレーンアクセス: APIとしてOKを返す
  if (e && e.parameter && e.parameter.callback) {
    var body = e.parameter.callback + '(' + JSON.stringify({ success: true, data: 'OK' }) + ');';
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}

// ===== JSONP API: Timeslot and Seats =====
/**
 * 指定の組の時間帯一覧を返す
 * @param {string|number} group
 * @return {Array<{day:string,timeslot:string,time:string,displayName:string}>}
 */
function getAllTimeslotsForGroup(group) {
  return TimeSlotConfig_getAllTimeslotsForGroup(group);
}

/**
 * 座席状態 + 時間帯表示情報
 * @param {string|number} group
 * @param {string|number} day
 * @param {string} timeslot
 * @param {boolean} isAdmin (未使用)
 * @return {{seats:Array<{row:string,col:number,status:string}>, meta:{group:string,day:string,timeslot:string,time:string,displayName:string}}}
 */
function getSeatData(group, day, timeslot, isAdmin) {
  var sheetId = getSeatSheetId(String(group), String(day), String(timeslot));
  var sheet = SpreadsheetApp.openById(sheetId).getSheetByName(TARGET_SEAT_SHEET_NAME);
  var data = sheet.getDataRange().getValues().slice(1);
  var seats = data.map(function(r){
    return { row: r[0], col: Number(r[1]), status: r[2] };
  });
  var time = TimeSlotConfig_getTimeslotTime(String(group), String(day), String(timeslot));
  var displayName = TimeSlotConfig_getTimeslotDisplayName(String(group), String(day), String(timeslot));
  return {
    seats: seats,
    meta: {
      group: String(group),
      day: String(day),
      timeslot: String(timeslot),
      time: time,
      displayName: displayName
    }
  };
}

/**
 * 選択座席の確保とログ記録（公演ごとのシートに対応）
 * @param {string|number} group
 * @param {string|number} day
 * @param {string} timeslot
 * @param {string|number} classNo
 * @param {string} name
 * @param {string} mail
 * @param {Array<{row:string,col:number}>} selectedSeatsArr
 * @return {string} 結果メッセージ
 */
function submitSelectedSeats(group, day, timeslot, classNo, name, mail, selectedSeatsArr) {
  var seatSheetId = getSeatSheetId(String(group), String(day), String(timeslot));
  var sheetSeats = SpreadsheetApp.openById(seatSheetId).getSheetByName(TARGET_SEAT_SHEET_NAME);
  var allRows = sheetSeats.getDataRange().getValues();
  var seatResults = [];
  selectedSeatsArr.forEach(function(sel){
    for (var i = 1; i < allRows.length; i++) {
      if (allRows[i][0] == sel.row && Number(allRows[i][1]) == Number(sel.col)) {
        if (allRows[i][2] !== "確保") {
          sheetSeats.getRange(i+1, 3).setValue("確保");
          sheetSeats.getRange(i+1, 4).setValue(name);
          seatResults.push(sel.row + "-" + sel.col + "：OK");
        } else {
          seatResults.push(sel.row + "-" + sel.col + "：既に確保済");
        }
        break;
      }
    }
  });

  // ログ記録（公演別IDが未設定なら既存ログにフォールバック）
  var logSheetId = getLogSheetId(String(group), String(day), String(timeslot)) || SHEET_ID_LOG;
  var logSheet = SpreadsheetApp.openById(logSheetId).getSheetByName(LOG_SHEET_NAME)
    || SpreadsheetApp.openById(logSheetId).insertSheet(LOG_SHEET_NAME);
  if (logSheet.getLastRow() === 0) {
    logSheet.appendRow(['タイムスタンプ', 'クラス', '氏名', 'メール', '座席リスト']);
  }
  logSheet.appendRow([
    new Date(),
    classNo,
    name,
    mail,
    selectedSeatsArr.map(function(s){ return s.row + "-" + s.col; }).join(",")
  ]);

  return "以下の座席を確保しました：\n" + seatResults.join("\n");
}