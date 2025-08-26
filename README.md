# 保護者席申込システム - 統合版

## 概要

このシステムは、複数の組と時間帯に対応した保護者席申込システムです。組選択から時間帯選択、座席申込まで一連の流れで動作します。

## システム構成

### ファイル構成
- `index.html` - 組選択ページ
- `timeslot.html` - 時間帯選択ページ
- `parent_multi.html` - 保護者席申込フォーム
- `styles.css` - スタイルシート
- `config.js` - フロントエンド設定ファイル
- `main.gs` - メインのGAS関数
- `SpreadsheetIds.gs` - スプレッドシートID管理
- `TimeSlotConfig.gs` - 時間帯設定管理

### 動作フロー
1. **組選択** (`index.html`)
   - 1組〜8組、見本演劇から選択
   - 選択情報をセッションストレージに保存

2. **時間帯選択** (`timeslot.html`)
   - 選択された組の利用可能な時間帯を表示
   - GASから時間帯情報を取得
   - 日別にグループ化して表示

3. **座席申込** (`parent_multi.html`)
   - 選択された組・時間帯に対応するスプレッドシートから座席データを取得
   - 座席選択と申込処理

## セットアップ手順

### 1. GASプロジェクトの設定

1. Google Apps Scriptで新しいプロジェクトを作成
2. 以下のファイルをアップロード：
   - `main.gs`
   - `SpreadsheetIds.gs`
   - `TimeSlotConfig.gs`
   - `index.html`
   - `timeslot.html`
   - `parent_multi.html`
   - `styles.css`

### 2. スプレッドシートIDの設定

`SpreadsheetIds.gs`ファイル内の`SEAT_SHEET_IDS`オブジェクトを編集：

```javascript
const SEAT_SHEET_IDS = {
  // 1組
  "1-1-A": "YOUR_ACTUAL_SHEET_ID_HERE",
  "1-1-B": "YOUR_ACTUAL_SHEET_ID_HERE",
  // ... 他の組・日・時間帯
};
```

### 3. スプレッドシートの準備

各座席管理用スプレッドシートには以下の構造の「Seats」シートが必要：

| 行 | 列 | ステータス | 申込者名 |
|----|----|-----------|----------|
| A  | 1  | 空        |          |
| A  | 2  | 確保      | 山田太郎 |
| ...| ...| ...       | ...      |

### 4. 時間帯設定の確認

`TimeSlotConfig.gs`ファイル内の`TIMESLOT_SCHEDULES`オブジェクトで各組の時間帯を確認・編集：

```javascript
const TIMESLOT_SCHEDULES = {
  "1": {
    "1": { "A": "10:00-10:55", "B": "11:35-12:30", "C": "13:10-14:05" },
    "2": { "D": "10:00-10:55", "E": "11:35-12:30", "F": "13:10-14:05" }
  },
  // ... 他の組
};
```

### 5. フロントエンド設定

`config.js`ファイル内の設定値を実際の値に変更：

```javascript
const FRONTEND_CONFIG = {
  development: {
    baseUrl: 'http://localhost:3000',
    gasApiUrl: 'https://script.google.com/macros/s/YOUR_DEV_SCRIPT_ID/exec'
  },
  production: {
    baseUrl: 'https://your-username.github.io/your-repository-name',
    gasApiUrl: 'https://script.google.com/macros/s/YOUR_PROD_SCRIPT_ID/exec'
  }
};
```

### 6. ライセンスキーの設定

`main.gs`ファイル内の`LICENSE_KEY`を設定：

```javascript
const LICENSE_KEY = 'YOUR_LICENSE_KEY_HERE';
```

## 使用方法

### 本番環境での運用

1. GASプロジェクトをデプロイ
2. `doGet()`関数のURLにアクセス
3. 組選択から順番に操作

## 主要機能

### 組選択機能
- 8組 + 見本演劇の選択
- セッションストレージでの情報保持

### 時間帯選択機能
- 組別の時間帯表示
- 日別グループ化
- GASからの動的データ取得

### 座席申込機能
- 動的座席表表示
- 複数座席選択
- リアルタイム座席状態更新
- 申込ログ記録

### エラーハンドリング
- セッション情報の検証
- GAS関数のエラー処理
- ユーザーフレンドリーなエラー表示

## カスタマイズ

### スタイルの変更
`styles.css`ファイルを編集してUIをカスタマイズできます。

### 時間帯の追加・変更
`TimeSlotConfig.gs`ファイルの`TIMESLOT_SCHEDULES`を編集してください。

### スプレッドシートIDの追加
`SpreadsheetIds.gs`ファイルの`SEAT_SHEET_IDS`に新しいエントリを追加してください。

## トラブルシューティング

### よくある問題

1. **座席データが表示されない**
   - スプレッドシートIDが正しく設定されているか確認
   - 「Seats」シートが存在するか確認

2. **時間帯が表示されない**
   - `TimeSlotConfig.gs`の設定を確認
   - GAS関数が正常に動作しているか確認

3. **申込が失敗する**
   - スプレッドシートの権限設定を確認
   - ログシートの存在を確認

4. **設定エラーが発生する**
   - `config.js`の設定値が正しく設定されているか確認
   - GASスクリプトIDが正しいか確認

### デバッグ方法

1. ブラウザの開発者ツールでコンソールを確認
2. GASのログでエラーを確認
3. セッションストレージの状態を確認

## ライセンス

このシステムは教育目的で作成されています。
