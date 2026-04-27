# Fullmoon V3 Accel

顔認証技術を活用した次世代の部活投票システム（MVP）。

## 技術スタック
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide React
- **Backend (API)**: Cloudflare Workers
- **Database**: Supabase (PostgreSQL)

## セットアップ手順

### 1. Supabase の準備
1. Supabase プロジェクトを作成します。
2. SQL Editor で `supabase_schema.sql` の内容を実行し、テーブルと関数を作成します。
3. `Project Settings > API` から `URL` と `service_role key` を取得します。

### 2. Cloudflare Worker のデプロイ
1. `worker` ディレクトリに移動します。
2. `wrangler` を使用してシークレットを設定します：
   ```bash
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   ```
3. デプロイします：
   ```bash
   npx wrangler deploy
   ```

### 3. Next.js の起動
1. ルートディレクトリで依存関係をインストールします：
   ```bash
   npm install
   ```
2. `.env.local` を作成し、環境変数を設定します（ローカル実行時は Worker へのリライトを設定済み）：
   ```bash
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```
3. 開発サーバーを起動します：
   ```bash
   npm run dev
   ```

## ディレクトリ構造
- `/app`: Next.js 14 App Router ページ
- `/components`: React コンポーネント（カメラキャプチャ等）
- `/worker`: Cloudflare Workers ソースコード
- `supabase_schema.sql`: データベース定義
