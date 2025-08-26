// スプレッドシートID
const SHEET_ID_SEATS = '164pnCFDZKmrHlwU0J857NzxRHBeFgdKLzxCwM7DKZmo';
const SHEET_ID_LOG   = '16ADG2Aniz6f_rbirpfngeLXh8D2Im2BA8uJotY394oU';
const SPREADSHEET_ID_KEY = '17w2V9kudoj_EAYUn-gsOG6PhH-_ComyWT6LTnWMXazg';
const KEY_SHEET_NAME = 'keys';

// 申込〆切
const PARENT_APP_DEADLINE = new Date("2025-07-31T13:00:00+09:00"); 

// 「ParentApplications」（ログ用）シート初期化関数
function initializeLogSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID_LOG);
  const sheet = ss.getSheetByName('ParentApplications') || ss.insertSheet('ParentApplications');
  sheet.clear();
  sheet.appendRow(['タイムスタンプ', 'クラス', '氏名', 'メール', '座席リスト']);
}

// 選択された組・日・時間帯に基づく時間帯情報を返す
function getTimeslotInfo(group, day, timeslot) {
  if (!group || !day || !timeslot) {
    throw new Error('必須パラメータが不足しています');
  }
  try {
    const time = getTimeslotTime(group, day, timeslot);
    const displayName = getTimeslotDisplayName(group, day, timeslot);
    const dayName = getDayName(day);
    return {
      group: String(group),
      day: String(day),
      dayName: dayName,
      timeslot: String(timeslot),
      time: String(time),
      displayName: String(displayName),
      description: `${dayName} ${displayName}`
    };
  } catch (error) {
    throw new Error('時間帯情報の取得に失敗しました');
  }
}

// 締切日時（ミリ秒）を取得
function getDeadlineTimestamp() {
  return PARENT_APP_DEADLINE.getTime();
}

// 全座席状態を取得（従来の関数 - 後方互換性のため）
function getAllSeats() {
  const sheet = SpreadsheetApp.openById(SHEET_ID_SEATS).getSheetByName("Seats");
  const data = sheet.getDataRange().getValues().slice(1); // 1行目はヘッダー
  return data.map(r => ({
    row: r[0],
    col: Number(r[1]),
    status: r[2]
  }));
}

// 指定されたスプレッドシートの全座席状態を取得（新関数）
function getAllSeatsForSheet(sheetId) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Seats");
    const data = sheet.getDataRange().getValues().slice(1); // 1行目はヘッダー
    return data.map(r => ({
      row: r[0],
      col: Number(r[1]),
      status: r[2]
    }));
  } catch (error) {
    throw new Error('座席データの取得に失敗しました');
  }
}

/**
 * 申込時：複数座席を一括確保＆ログ記録（従来の関数 - 後方互換性のため）
 * @param {string|number} classNo - クラス番号
 * @param {string} name - 氏名
 * @param {string} mail - メールアドレス
 * @param {Array<{row:string, col:number}>} selectedSeatsArr - 申込座席リスト [{row:..., col:...}, ...]
 */
function submitMultipleSeats(classNo, name, mail, selectedSeatsArr) {
  return submitMultipleSeatsForSheet(SHEET_ID_SEATS, classNo, name, mail, selectedSeatsArr);
}

/**
 * 申込時：指定されたスプレッドシートで複数座席を一括確保＆ログ記録（新関数）
 * @param {string} sheetId - スプレッドシートID
 * @param {string|number} classNo - クラス番号
 * @param {string} name - 氏名
 * @param {string} mail - メールアドレス
 * @param {Array<{row:string, col:number}>} selectedSeatsArr - 申込座席リスト [{row:..., col:...}, ...]
 */
function submitMultipleSeatsForSheet(sheetId, classNo, name, mail, selectedSeatsArr) {
  try {
    // 座席確保
    const sheetSeats = SpreadsheetApp.openById(sheetId).getSheetByName("Seats");
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
      logSheet.appendRow(['タイムスタンプ', 'クラス', '氏名', 'メール', '座席リスト', 'スプレッドシートID']);
    }
    logSheet.appendRow([
      new Date(),
      classNo,
      name,
      mail,
      selectedSeatsArr.map(s => s.row + "-" + s.col).join(","),
      sheetId
    ]);
    
    return "以下の座席を確保しました：\n" + seatResults.join("\n");
  } catch (error) {
    throw new Error('座席の確保に失敗しました');
  }
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

// ===== API形式対応 =====

// APIエンドポイント - POSTリクエストを処理
function doPost(e) {
  try {
    // CORSヘッダーを設定
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // リクエストデータを解析
    const requestData = JSON.parse(e.postData.contents);
    const functionName = requestData.function;
    const params = requestData.params || {};

    // 関数名に基づいて適切な関数を呼び出し
    let result;
    switch (functionName) {
      case 'getTimeslotInfo':
        result = getTimeslotInfo(params.group, params.day, params.timeslot);
        break;
      case 'getAllSeatsForSheet':
        result = getAllSeatsForSheet(params.sheetId);
        break;
      case 'getSeatSheetId':
        result = getSeatSheetId(params.group, params.day, params.timeslot);
        break;
      case 'submitMultipleSeatsForSheet':
        result = submitMultipleSeatsForSheet(
          params.sheetId, 
          params.classNo, 
          params.name, 
          params.mail, 
          params.selectedSeatsArr
        );
        break;
      case 'getDeadlineTimestamp':
        result = getDeadlineTimestamp();
        break;
      case 'getAllTimeslotsForGroup':
        result = getAllTimeslotsForGroup(params.group);
        break;
      case 'validateLicense':
        result = validateLicense();
        break;
      default:
        throw new Error(`未知の関数: ${functionName}`);
    }

    // レスポンスを返す
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);

  } catch (error) {
    const errorResponse = {
      error: true,
      message: error.message
    };

    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      });
  }
}

// OPTIONSリクエスト（CORS preflight）を処理
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

// Web公開用（従来の形式 - 後方互換性のため）
function doGet() {
  try {
    return HtmlService
      .createHtmlOutputFromFile("index")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setTitle('保護者用整理券システム')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (e) {
    var html = HtmlService.createHtmlOutput(
      '<!DOCTYPE html>' +
      '<html lang="ja">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>保護者用整理券システム</title>' +
      '</head>' +
      '<body style="font-family:Arial,\'Noto Sans JP\',sans-serif;padding:16px;">' +
      '<h2>簡易ページ</h2>' +
      '<p>index ページがGASプロジェクトに存在しないため、簡易ページを表示しています。</p>' +
      '<p>フロントエンドは静的ホスティングから提供し、GASはAPIとして利用できます。</p>' +
      '</body></html>'
    );
    html.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    return html;
  }
}