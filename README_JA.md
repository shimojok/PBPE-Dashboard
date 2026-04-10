# PBPE-Dashboard: Planetary Bio-Phenome Engine（惑星生命圏フェノームエンジン）

## 🌍 再生型農業による気候変動ファイナンス市場創出

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-lightgrey.svg)](https://soliditylang.org/)

**PBPE（Planetary Bio-Phenome Engine：惑星生命圏フェノームエンジン）**は、農業生産を測定可能・検証可能・金融化可能な気候資産に変換する、世界初の統合プラットフォームです。

> **「1杯のコーヒーが地球を再生する。」**
> — *コーヒー購入＝炭素隔離＝気候変動ファイナンス資産*

---

## 📊 中核的価値提案

| 指標 | 数値 | 意義 |
|------|------|------|
| **農場レベルROI** | 17.8倍 | 投資1ドルが農家に17.80ドルのリターン |
| **システム乗数** | 94.1倍 | 農場1ドル＝総経済価値94.10ドル |
| **炭素隔離量** | 2.5 tCO₂e/ha/年 | 年間125本の植林相当/ha |
| **農家収入増加** | +110% | 1,850ドル/ha → 3,892ドル/ha |
| **病害損失回避** | 85-100% | コーヒーさび病抑制 |
| **10年NPV（500万ha）** | 724億ドル | 割引率8%で計算 |
| **市場創出規模** | 1,875-5,900億ドル | 10年累積新規市場価値 |

---

## 🏗️ アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                    第4層：MABC金融層                         │
│  再生型債券 │ 収量連動トークン │ 炭素担保資産                │
├─────────────────────────────────────────────────────────────┤
│                  第3層：SafelyChain台帳層                    │
│  暗号的MRV │ ゼロ知識証明 │ トークン化                      │
├─────────────────────────────────────────────────────────────┤
│                 第2層：AGRIXフェノミクス層                   │
│  リアルタイム計測 │ AI分析 │ 炭素定量化                     │
├─────────────────────────────────────────────────────────────┤
│                 第1層：MBT55バイオ層                         │
│  病害抑制 │ 土壌再生 │ 炭素固定                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 クイックスタート

### 前提条件
- Node.js 18以上
- Python 3.9以上
- Azure CLI（デプロイ用）

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/your-org/PBPE-Dashboard.git
cd PBPE-Dashboard

# フロントエンド依存関係のインストール
cd dashboard
npm install

# Python依存関係のインストール
pip install -r requirements.txt

# 開発サーバー起動
npm run dev
```

### ダッシュボードアクセス
ブラウザで `http://localhost:3000` を開いてPBPEダッシュボードを表示します。

---

## 📁 リポジトリ構造

```
PBPE-Dashboard/
├── docs/           # ドキュメント（日本語・英語）
├── dashboard/      # React/TypeScriptフロントエンド
├── contracts/      # Solidityスマートコントラクト
├── azure/          # Azure展開テンプレート
└── models/         # Python計算エンジン
```

---

## 🔬 主要数理モデル

### 農家収益関数

$$P_{farmer} = [Y_{base} \cdot (1 + \Delta Y) \cdot (1 - R \cdot (1-\eta))] \cdot (P + P_{qual}) + \Delta C \cdot P_C \cdot \lambda - C_{chem} \cdot (1 - \gamma)$$

### 炭素隔離動態モデル

$$\frac{d(SOC)}{dt} = k_{hum} \cdot B_{microbe} \cdot f(T, moisture) \cdot \frac{OM_{input}}{C/N_{ratio}} - k_{resp} \cdot SOC \cdot e^{\frac{E_a}{RT}}$$

### 資本乗数効果

$$M_{PBPE} = \prod_{l=1}^{4} (1 + \mu_l) = 17.8 \times 1.4 \times 1.8 \times 2.1 = 94.1\text{倍}$$

---

## 💻 技術スタック

| コンポーネント | 技術 |
|---------------|------|
| フロントエンド | React 18, TypeScript, D3.js, TailwindCSS |
| バックエンド | Python 3.9, FastAPI, NumPy, SciPy |
| ブロックチェーン | Solidity, Azure Managed CCF |
| クラウド | Microsoft Azure (Functions, Digital Twins, IoT Hub) |
| データベース | Azure Cosmos DB, PostgreSQL |

---

## 📈 ユースケース

| 業界 | 課題 | PBPEソリューション |
|------|------|-------------------|
| **コーヒー** | さび病、価格変動 | 85%病害抑制、炭素収入創出 |
| **養蜂** | 蜂群崩壊症候群 | 腸内細菌叢改善 |
| **シイタケ** | 害菌汚染、低収量 | 競合菌抑制 |
| **養殖** | 水質悪化、疾病 | NASARA/海創水による水質浄化 |

---

## 🤝 貢献について

行動規範とプルリクエスト提出プロセスの詳細は [CONTRIBUTING_JA.md](CONTRIBUTING_JA.md) をご覧ください。

---

## 📄 ライセンス

本プロジェクトはMITライセンスの下で提供されています。詳細は [LICENSE](LICENSE) ファイルをご確認ください。

---

## 🙏 謝辞

- スターバックスコーポレーション
- ビル＆メリンダ・ゲイツ財団
- マイクロソフトAzureチーム
- BioNexus Holdings

---

**連絡先:** info@terraviss.com  
**ドキュメント:** [English](./docs/en/) | [日本語](./docs/ja/)
