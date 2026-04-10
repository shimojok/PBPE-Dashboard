# PBPE-Dashboard への貢献について

**Languages:** [English](./CONTRIBUTING.md) | [日本語](./CONTRIBUTING_JA.md)

PBPE（Planetary Bio-Phenome Engine：惑星生命圏フェノームエンジン）プロジェクトに関心をお寄せいただき、ありがとうございます！

## 🌍 私たちのミッション

PBPEは、世界の農業を炭素陽性かつ金融的に再生可能なシステムへと転換することを目指しています。貢献することで、気候変動ファイナンス市場創出のためのインフラ構築に参加できます。

## 📋 行動規範

本プロジェクトは [Contributor Covenant 行動規範](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) に従います。参加することにより、この規範を遵守することが期待されます。

## 🔄 貢献ワークフロー

### 1. フォークとクローン
```bash
git clone https://github.com/あなたのユーザー名/PBPE-Dashboard.git
cd PBPE-Dashboard
```

### 2. ブランチ作成
```bash
git checkout -b feature/機能名
# または
git checkout -b fix/バグ修正内容
```

ブランチ命名規則：
- `feature/*` - 新機能
- `fix/*` - バグ修正
- `docs/*` - ドキュメント更新
- `refactor/*` - コードリファクタリング
- `test/*` - テスト追加

### 3. 開発環境セットアップ

#### フロントエンド（React/TypeScript）
```bash
cd dashboard
npm install
npm run dev
```

#### Pythonモデル
```bash
python -m venv venv
source venv/bin/activate  # Windowsの場合: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. 変更の実装

- 明確でコメント付きのコードを書く
- 既存のコードスタイルに従う
- 必要に応じてテストを追加・更新
- ドキュメントを更新

### 5. コミットガイドライン

[Conventional Commits](https://www.conventionalcommits.org/ja/) を使用してください：

```bash
feat: 炭素隔離計算機能を追加
fix: 収量予測のエッジケースを修正
docs: API仕様書を更新
test: 金融エンジンのユニットテストを追加
refactor: 資本フロー計算を最適化
```

### 6. プッシュとプルリクエスト作成

```bash
git push origin feature/機能名
```

その後、`main` ブランチに対してプルリクエストを作成してください。

## ✅ プルリクエストチェックリスト

- [ ] コードがエラーなくコンパイルされる
- [ ] テストが通過する（`npm test` / `pytest`）
- [ ] ドキュメントが更新されている
- [ ] コミットメッセージが規約に従っている
- [ ] 関連Issueがリンクされている（該当する場合）

## 🧪 テスト

### フロントエンドテスト
```bash
cd dashboard
npm test
```

### Pythonテスト
```bash
pytest tests/
```

## 📚 ドキュメント

- 主要機能追加時は `README.md` を更新
- `docs/` ディレクトリ内の関連ファイルを更新
- 英語版（`docs/en/`）と日本語版（`docs/ja/`）の両方を維持

## 🔍 コードレビュープロセス

1. すべてのPRは最低1名のレビューが必要
2. CIチェックが通過すること
3. ドキュメントが完全であること
4. 破壊的変更は事前議論が必要

## 🏷️ Issue作成ガイドライン

### バグ報告
以下を含めてください：
- 明確な説明
- 再現手順
- 期待される動作と実際の動作
- 環境情報（OS、Node/Pythonバージョン）

### 機能リクエスト
以下を含めてください：
- 課題の説明
- 提案する解決策
- 代替案の検討
- 影響範囲の評価

## 📞 お問い合わせ

- **ディスカッション**: [GitHub Discussions](https://github.com/your-org/PBPE-Dashboard/discussions)
- **メール**: info@terraviss.com

## 🙏 謝辞

すべての貢献者は [CONTRIBUTORS.md](CONTRIBUTORS.md) に掲載されます。

---

**コードで地球を再生する活動にご参加いただき、ありがとうございます！** 🌱
