# Novel Node Editor アーキテクチャ概要

本ドキュメントでは Novel Node Editor の全体構成と主要コンポーネントの責務、ビルド環境についてまとめます。

## 全体構成

アプリケーションは Vite + React で構築された SPA であり、ノードベースのシーン編集 UI を提供します。主要なデータフローは下図のように、`SceneFlowProvider` が `useSceneFlow` / `useContextMenu` / `useSceneStorage` を束ねて UI コンポーネントへ状態を供給する構造です。

```mermaid
flowchart LR
  subgraph UI[UI Components]
    Toolbar[FlowToolbar]
    Canvas[FlowCanvas]
    Sidebar[FlowSidebar]
    Context[FlowContextMenu]
  end
  Hooks[SceneFlowProvider
( useSceneFlow / useContextMenu / useSceneStorage )]
  Storage[(localStorage)]
  ReactFlow[React Flow Graph]

  Toolbar -->|操作| Hooks
  Canvas -->|ユーザー操作| Hooks
  Sidebar -->|編集入力| Hooks
  Context -->|メニュー操作| Hooks
  Hooks -->|ノード/エッジ状態| ReactFlow
  Hooks -->|同期済みデータ| UI
  Hooks -->|保存・読込| Storage
```

## ディレクトリ構成

```
src/
├─ App.tsx              # 画面全体を組み立てるルートコンポーネント
├─ main.tsx             # React エントリポイント
├─ index.css            # Tailwind ベースのスタイル定義
├─ components/          # 共通 UI 部品 (コンテキストメニューやノード描画など)
├─ features/
│  └─ scene/            # シーンエディタ機能一式
│     ├─ SceneEditorLayout.tsx
│     ├─ SceneFlowProvider.tsx
│     └─ components/    # シーンエディタ専用 UI (Canvas / Sidebar / Toolbar)
├─ components/          # 画面部品 (Canvas / Sidebar / Toolbar など)
├─ features/
│  └─ scene/
│     └─ domain/        # シーンノードの正規化・スナップショット・要約整形ロジック
├─ hooks/               # 状態管理用のカスタムフック群
└─ types/               # 型定義 (Scene ノード型など)
```

### 主要モジュールと責務

| モジュール | 位置 | 主な責務 |
| --- | --- | --- |
| `App.tsx` | `src/App.tsx` | React Flow プロバイダ配下で `SceneFlowProvider` を組み合わせ、シーンエディタレイアウトを描画する。 |
| `SceneFlowProvider` | `src/features/scene/SceneFlowProvider.tsx` | シーン編集に必要な状態とハンドラをコンテキストで提供し、`useSceneFlow`・`useContextMenu`・`useSceneStorage` を統合する。 |
| `SceneEditorLayout` | `src/features/scene/SceneEditorLayout.tsx` | プロバイダから取得した状態でツールバー・キャンバス・サイドバーを配置し、副作用（タイトル入力フォーカスなど）を管理する。 |
| `FlowCanvas` | `src/features/scene/components/FlowCanvas.tsx` | React Flow を描画し、ノード・エッジ操作イベントをコンテキスト経由で処理する。ミニマップやコントロール UI も提供。 |
| `FlowSidebar` | `src/features/scene/components/FlowSidebar.tsx` | 選択中ノードのタイトル・概要編集フォームを表示し、入力値変更をコンテキスト経由で即時反映させる。 |
| `FlowToolbar` | `src/features/scene/components/FlowToolbar.tsx` | 新規作成、保存、読み込み、ノード追加といったコマンドボタンを提供し、ファイル入力の制御も担う。 |
| `SceneNode` | `src/components/SceneNode.tsx` | 各シーンノードの見た目とインライン編集 UI を担当。選択状態や編集モードに応じたスタイルを切り替える。 |
| `ContextMenu` | `src/components/ContextMenu.tsx` | ノード／キャンバスでのコンテキストメニューを表示し、削除・ノード追加などの操作をトリガーする。 |
| `useSceneFlow` | `src/hooks/useSceneFlow.ts` | React Flow のノード・エッジ状態を管理し、追加・削除・接続・編集ハンドラを実装する中核フック。ローカル UI 状態（選択、編集中ノード）もここで管理。 |
| `useSceneStorage` | `src/hooks/useSceneStorage.ts` | `localStorage` へのスナップショット保存・読み込み、新規リセット処理を担当。 |
| `useContextMenu` | `src/hooks/useContextMenu.ts` | ノード／キャンバス用のコンテキストメニュー状態と表示位置を制御する。 |
| シーンドメインユーティリティ | `src/features/scene/domain/` | ノードデータの同期・正規化、スナップショット生成／復元、概要整形を提供するドメインロジック群。 |
| `Scene` 型定義 | `src/types/scene.ts` | ノードデータ構造 (`SceneNodeData`) と `SceneNode` 型の TypeScript 定義。 |

### シーンドメインモジュール構成

- `nodeSync.ts`: `SceneNode` の `data` から UI 専用フィールドを取り除き、タイトルが空の場合は ID から既定値を生成する。React Flow から渡される `Node` を編集用の `SceneNode` に正規化するための `normalizeToSceneNode` もここで提供する。
- `snapshot.ts`: スナップショットの保存・復元を担当。`zod` で `version`・ノード・エッジ構造を検証し、互換性のないデータを受け取った場合は `null` を返す安全なパーサーを実装する。
- `summaryFormatter.ts`: シーン概要テキストを 20 文字単位で折り返し、最大 2 行・末尾省略記号付きで表示する関数を提供する。前後の空白は表示前にトリムされる。

## 状態とデータフロー

- ノードとエッジの配列は `useSceneFlow` 内で `useState` により管理され、React Flow の `onNodesChange` / `onEdgesChange` コールバックを通じて更新されます。
- サイドバーやノードのインライン編集で入力されたタイトル・概要は、選択中ノード ID を参照しながら `useSceneFlow` が即時に同期します。
- `useSceneStorage` が `localStorage` に JSON 形式でスナップショットを保存し、読み込み時には `features/scene/domain` のスナップショットモジュールでスキーマ検証と正規化を行ってから `useSceneFlow` に適用します。
- コンテキストメニューは `useContextMenu` が DOM 座標を React Flow 座標に変換しながら開閉を制御します。

## ビルド設定と開発フロー

| 設定ファイル | 主な役割 |
| --- | --- |
| `vite.config.ts` | Vite のエントリ設定。React プラグイン (`@vitejs/plugin-react`) を読み込み、高速な HMR と TSX サポートを提供します。 |
| `tailwind.config.js` | Tailwind CSS の `content` 対象とダークモード設定 (`class`) を定義。`src` 配下と `index.html` がスキャン対象です。 |
| `postcss.config.js` | PostCSS パイプラインに `tailwindcss` と `autoprefixer` を適用。 |
| `tsconfig.json` / `tsconfig.node.json` | TypeScript コンパイル設定。ビルド時は `tsc -b` で型検査を実施します。 |

### 主要依存ライブラリ

- **React 18**: UI 構築のベース。
- **React Flow**: ノードベースのグラフ描画と編集機能を提供。
- **Tailwind CSS**: ユーティリティベースのスタイリングを実現し、`index.css` 内でカスタムクラスを構築。
- **Vite**: 開発サーバーとビルドツール。React プラグインによって JSX/TSX トランスフォームをサポート。
- **TypeScript**: 型安全なコンポーネント開発を支援。

## 補足: スタイルとテーマ

- `src/index.css` で Tailwind の `@apply` を利用し、ノードの状態（通常／選択／編集中）に応じたクラスを定義しています。
- ルート要素に `dark` クラスを付与し、常時ダークテーマを適用しています。

## 開発・ビルド手順

1. 依存関係のインストール: `npm install`
2. 開発サーバー起動: `npm run dev`（Vite 開発サーバー）
3. 本番ビルド: `npm run build`（TypeScript 型チェック + Vite ビルド）
4. ビルドプレビュー: `npm run preview`

以上がプロジェクトのアーキテクチャ概要です。
