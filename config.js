// ==== フロント・GAS間通信設定ファイル ====
// GAS API形式対応版
//
// セットアップ手順：
// 1. 以下の設定値を実際の値に変更してください
// 2. GitHub Pagesを有効化（Settings > Pages > Source: Deploy from a branch）
// 3. ブランチをmain（またはmaster）に設定

// フロントエンド設定（GAS APIエンドポイントのみ使用）
const FRONTEND_CONFIG = {
  // 開発環境
  development: {
    gasApiUrl: 'https://script.google.com/macros/s/AKfycbxTsA1hlgH_VIlztz22-k37lYEL8ChgqCKxhxbcLQPO35rlz-k5AKSZaswa-6TSltXP2g/exec'
  },
  // GitHub Pages本番環境
  production: {
    gasApiUrl: 'https://script.google.com/macros/s/AKfycbxTsA1hlgH_VIlztz22-k37lYEL8ChgqCKxhxbcLQPO35rlz-k5AKSZaswa-6TSltXP2g/exec'
  }
};

// 現在の環境設定（development または production）
// GitHub Pagesでは自動的にproduction環境として動作
const CURRENT_ENV = 'production';

// 現在の環境の設定を取得
function getCurrentConfig() {
  return FRONTEND_CONFIG[CURRENT_ENV];
}

// GAS APIのURLを取得
function getGasApiUrl() {
  return getCurrentConfig().gasApiUrl;
}

// GAS API呼び出し用の共通関数
async function callGasApi(functionName, params = {}) {
  try {
    const url = getGasApiUrl();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        function: functionName,
        params: params
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('GAS API呼び出しエラー:', error);
    throw error;
  }
}

// 時間帯情報を取得するAPI関数
async function getTimeslotInfo(group, day, timeslot) {
  try {
    const result = await callGasApi('getTimeslotInfo', {
      group: group,
      day: day,
      timeslot: timeslot
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('時間帯情報取得エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 座席データを取得するAPI関数
async function getAllSeatsForSheet(sheetId) {
  try {
    const result = await callGasApi('getAllSeatsForSheet', {
      sheetId: sheetId
    });
    return result;
  } catch (error) {
    console.error('座席データ取得エラー:', error);
    throw error;
  }
}

// スプレッドシートIDを取得するAPI関数
async function getSeatSheetId(group, day, timeslot) {
  try {
    const result = await callGasApi('getSeatSheetId', {
      group: group,
      day: day,
      timeslot: timeslot
    });
    return result;
  } catch (error) {
    console.error('スプレッドシートID取得エラー:', error);
    throw error;
  }
}

// 座席申込を実行するAPI関数
async function submitMultipleSeatsForSheet(sheetId, classNo, name, mail, selectedSeatsArr) {
  try {
    const result = await callGasApi('submitMultipleSeatsForSheet', {
      sheetId: sheetId,
      classNo: classNo,
      name: name,
      mail: mail,
      selectedSeatsArr: selectedSeatsArr
    });
    return result;
  } catch (error) {
    console.error('座席申込エラー:', error);
    throw error;
  }
}

// 締切時間を取得するAPI関数
async function getDeadlineTimestamp() {
  try {
    const result = await callGasApi('getDeadlineTimestamp');
    return result;
  } catch (error) {
    console.error('締切時間取得エラー:', error);
    throw error;
  }
}

// 時間帯一覧を取得するAPI関数
async function getAllTimeslotsForGroup(group) {
  try {
    const result = await callGasApi('getAllTimeslotsForGroup', {
      group: group
    });
    return result;
  } catch (error) {
    console.error('時間帯一覧取得エラー:', error);
    throw error;
  }
}

// ライセンス検証を実行するAPI関数
async function validateLicense() {
  try {
    const result = await callGasApi('validateLicense');
    return result;
  } catch (error) {
    console.error('ライセンス検証エラー:', error);
    throw error;
  }
}

// 設定値の検証
function validateConfig() {
  const config = getCurrentConfig();
  const requiredFields = ['gasApiUrl'];
  
  for (const field of requiredFields) {
    if (!config[field] || config[field].includes('HERE') || config[field].includes('your-')) {
      console.warn(`設定が不完全です: ${field} = ${config[field]}`);
      return false;
    }
  }
  return true;
}

// 設定の検証を実行
if (typeof window !== 'undefined') {
  validateConfig();
}
