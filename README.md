## Teacher Seat Reservation (GitHub Pages + GAS JSONP)

### 概要
- フロントエンドは GitHub Pages 等の静的ホスティング上で動作。
- バックエンドは Google Apps Script (GAS) を API 専用で公開し、すべて JSONP で通信。
- 時間帯（スケジュール）はクライアント同梱の `timeslot-schedules.js` を参照して高速表示。
- 最終申込画面は `parent_multi.html` を使用し、座席読み込みと申込を GAS に JSONP 送信。
- ログ書き込みや座席確保は GAS がスプレッドシートに対して実行。

### ファイル構成（主要）
- `index.html`: 組選択ページ。各組をクリックして `timeslot.html?group=...` に遷移。
- `timeslot.html`: 時間帯選択ページ。URL の `group` を基に時間帯一覧を即時表示。
- `timeslot-main.js`: 時間帯ページの制御。`timeslot-schedules.js` から一覧取得、クリックで `parent_multi.html?group=...&day=...&timeslot=...` に遷移。
- `timeslot-schedules.js`: クライアント用スケジュール定義とヘルパー。時間帯表示や `getAllTimeslotsForGroup` を提供。
- `parent_multi.html`: 先生用座席申込フォーム（最終画面）。JSONP で座席読み込み(`getSeatData`)・申込(`submitSelectedSeats`) を実行。座席は「空」以外はクリック不可。
- `api.js`: JSONP クライアント。`config.js` の GAS URL とコールバックを使い、全ての API を JSONP で呼び出す。`_ensureSuccess` で `{success:false}` を例外化。
- `config.js`: GAS エンドポイント設定とデバッグフラグ（`DEBUG_MODE=false` 推奨）。
- `styles.css`: 共通スタイル。

GAS 側:
- `main.gs`: API ディスパッチ（`doGet`）とエンドポイント実装。
  - `getSeatData(group, day, timeslot, isAdmin)`
  - `submitSelectedSeats(group, day, timeslot, classNo, name, mail, selectedSeatsArr)`
  - `getAllTimeslotsForGroup(group)`（現在はクライアント即時表示のため原則未使用）
  - `getAllSeats`（旧互換）/`getDeadlineTimestamp`/`validateLicense`/`testApi`
  - API 専用: HTML は返さず `OK` を返す（JSONP なら `{success:true,data:'OK'}`）。
- `SpreadsheetIds.gs`: 公演ごとの座席シートID/ログシートIDのマッピング。キーは `group-day-timeslot`。
- `TimeSlotConfig.gs`: サーバー側のスケジュール定義とヘルパー（API 内部用）。

### 依存関係
- フロント → GAS: すべて JSONP 通信（CORS 回避）。
- フロント → スケジュール: `timeslot-schedules.js`（静的データ）
- GAS → スプレッドシート: `SpreadsheetIds.gs` の設定に従い、該当の `TARGET_SEAT_SHEET_NAME` シートにアクセス。

### データフロー
1) `index.html` で組を選択 → `timeslot.html?group=...`
2) `timeslot-main.js` が `timeslot-schedules.js` から時間帯一覧を生成。
3) 時間帯をクリック → `parent_multi.html?group=...&day=...&timeslot=...`
4) `parent_multi.html` が `GasAPI.getSeatData(group, day, timeslot)` を JSONP 呼び出しし、座席表を描画。
   - 返却 `meta` に `sheetId` と `sheetName` を含むため、対象スプレッドシートが確認可能。
   - 座席は status が「空」のみクリック可。それ以外は選択不可。
5) 申込時に `GasAPI.submitSelectedSeats(...)` を JSONP 送信し、GAS 側で座席確保・ログ追記。

### エンドポイント仕様（JSONP）
- 呼び出し: `GET {GAS_URL}?callback={cb}&func={name}&params={encodeURIComponent(JSON.stringify([...]))}`
- 共通レスポンス: `{ success: boolean, data?: any, error?: string }`

主要エンドポイント:
- `getSeatData(group, day, timeslot, isAdmin)` →
```json
{
  "success": true,
  "data": {
    "seats": [{"row":"A","col":1,"status":"空"}],
    "meta": {"group":"見本演劇","day":"1","timeslot":"A","time":"15:30-15:50","displayName":"A時間帯 (15:30-15:50)","sheetId":"...","sheetName":"Seats"}
  }
}
```
- `submitSelectedSeats(group, day, timeslot, classNo, name, mail, selectedSeatsArr)`
  - `selectedSeatsArr`: `[{row:"A", col:1}, ...]`
  - 戻り値: 文字列メッセージ（例: `以下の座席を確保しました：\nA-1：OK\n...`）
- `getDeadlineTimestamp()` → `number (ms)`

### 操作方法
1) GitHub Pages へ `index.html` を公開し、リンクから導線に沿って操作。
2) 時間帯選択 → 最終画面 `parent_multi.html` に遷移。
3) 座席を選ぶ（「空」のみ選択可）→ クラス/氏名/メールを入力 → 申込。

### カスタマイズ方法
- 組や時間帯の追加/変更: `timeslot-schedules.js` の `TIMESLOT_SCHEDULES` を編集。
  - サーバー側の `TimeSlotConfig.gs` も同様の定義に合わせると、API内の `displayName/time` に一貫性が出ます。
- 座席ステータスの扱い変更: `parent_multi.html` の描画ロジック（`drawSeats`）で `status !== '空'` をクリック不可にしています。判定を変更する場合はその条件を調整。
- ログ/シート設定: `SpreadsheetIds.gs`
  - `SEAT_SHEET_IDS["{group}-{day}-{timeslot}"] = "<SHEET_ID>"`
  - 必要なら `LOG_SHEET_IDS` も設定。未設定時は `SHEET_ID_LOG` にフォールバック。
- デザイン: `styles.css` を編集。タイトル文言は `parent_multi.html` 冒頭の `.title`、時間帯説明は `#timeslot-desc` に出力。
- デバッグ: `config.js` の `DEBUG_MODE` を `true` にすると JSONP の送受信を console 出力。既定は `false`。

### デバッグ/トラブルシュート
- ブラウザコンソールに JSONP の送受信ログを出力
  - 取得時: `console.log('[JSONP] getSeatData', { request:{group,day,timeslot}, responseMeta:{sheetId,sheetName,...} })`
  - 申込時: `console.log('[JSONP] submitSelectedSeats', { request:{group,day,timeslot,classNo,seatCount}, response:{message} })`
- 期限・座席取得・申込の各処理で失敗時は画面エラー表示+console に詳細を出力。
- GAS 側で `{success:false}` または例外が返るとクライアントは例外化（`_ensureSuccess`）します。
- よくある原因
  - `SpreadsheetIds.gs` の該当キー未設定 → `getSeatSheetId` が例外。
  - GAS のデプロイ URL が古い → `config.js` の `GAS_API_URLS` に最新エンドポイントを設定。

### セキュリティ/運用上の注意
- JSONP は任意スクリプトの実行を伴うため、公開先の GAS URL を限定・管理してください。
- 大量アクセス時は GAS の実行回数制限に注意。必要ならキャッシュやビュー最適化を検討。
- 個人情報の取扱い（氏名・メール）に注意。ログシートの権限やアクセス範囲を適切に設定してください。

### セットアップ手順（GAS）
1) `main.gs` / `SpreadsheetIds.gs` / `TimeSlotConfig.gs` を GAS プロジェクトに配置。
2) `doGet` を Web アプリとしてデプロイ（誰でも実行可/匿名可など用途に応じて設定）。
3) デプロイURL（`.../exec`）を `config.js` の `GAS_API_URL` または `GAS_API_URLS` に設定。
4) `SpreadsheetIds.gs` に対象公演のシートIDを設定。

### セットアップ手順（フロント）
1) リポジトリを GitHub Pages（または任意の静的ホスティング）で公開。
2) `config.js` の `GAS_API_URL`/`GAS_API_URLS` に GAS デプロイURLを設定。
3) `index.html` を開き、導線に従って動作確認。

### ライセンス/バージョン管理
- このプロジェクトは学校内用途等を想定。外部公開時は各種権利・規約を要確認。
- デプロイ時は GAS 側の新旧URLが混在しないよう、`config.js` の URL リストを最新化してください。


