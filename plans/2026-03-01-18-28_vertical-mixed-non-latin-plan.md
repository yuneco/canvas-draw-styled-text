# 縦書き mixed / sideways 分離対応

## 目的

- 変更対象は縦書きのみとし、横書きのレイアウトと描画は変えない。
- 縦書きでは、日本語のような upright 系の文字は `mixed` 相当で描き、ASCII 系の横倒し run は `sideways` で描く。
- WebKit で `mixed` のまま ASCII 系を描くと文字幅が広がる問題を避ける。

## 最終仕様

- 縦書き時の内部 orientation 分類:
  - `sideways`
    - ASCII 表示文字と半角スペース（`U+0020..U+007E`）
    - `Extended_Pictographic` を含む grapheme（ZWJ 絵文字を含む）
  - `mixed`
    - 上記以外
- 横書き時は従来どおり単一の水平描画を行う。
- `drawStyledText()` / `measureStyledText()` の公開 API は変更しない。

## 実装方針

- 計測:
  - 縦書き用の共有 canvas を `mixed` / `sideways` の 2 系統に分ける。
  - grapheme ごとに orientation を決めて、対応する計測 context の `measureText()` を使う。
- 描画:
  - 縦書きでは、`style` と `orientation` の両方で run を分割する。
  - 1 枚の visible canvas 上で `textOrientation` を run ごとに切り替える方式は採用しない。
  - 代わりに、orientation ごとの offscreen canvas に run を描き、`drawImage()` で visible canvas に合成する。
- Retina 対応:
  - 合成時は visible canvas の現在 transform から実効スケールを取得する。
  - offscreen canvas はその倍率ぶんの backing store で描き、論理サイズへ縮めて転写する。

## 実装で確定した学び

- WebKit では、同一 visible canvas 上で `canvas.style.textOrientation` を run ごとに切り替えても、ASCII の描画幅が `mixed` 側のままになる。
- `requestAnimationFrame` を挟んでも挙動は変わらなかったため、反映遅延ではなく、同一 visible canvas 上での per-run 切替自体が使えないと判断した。
- `textOrientation` を固定した offscreen canvas に描いて `drawImage()` で合成すると、ASCII run の幅は意図どおりに揃う。
- offscreen canvas を論理解像度のまま転写すると Retina 環境で滲むため、backing store を transform に合わせて拡大する必要がある。

## 実装結果

- `src/drawText/verticalOrientation.ts`
  - 縦書き時の internal orientation 分類を追加した。
- `src/drawText/sharedCtx.ts`
  - 縦書き計測 / 合成用の共有 canvas を `mixed` / `sideways` の 2 系統で保持するようにした。
- `src/drawText/drawTextLines.ts`
  - 縦書き計測を orientation-aware にした。
  - 縦書き run を `style + orientation` で分割するようにした。
  - 縦書き run を offscreen canvas に描いて `drawImage()` で合成するようにした。
  - 通常時のセグメントログは止め、`DEBUG` 時だけ出すようにした。
- `src/drawText/verticalText.test.ts`
  - orientation 分類テストを追加した。
  - run 分割は `DEBUG` ログを使って検証する形にした。
- `README.md`
  - 縦書きの説明を現行実装に合わせて更新する。

## 検証結果

- `pnpm exec tsc --noEmit` 通過
- `pnpm vitest run src/drawText/verticalText.test.ts` 通過
- 実表示確認:
  - 日本語は `mixed` 側で縦組み表示
  - ASCII run は `sideways` 側で正常な字間
  - 絵文字は実験的に `sideways` 側へ寄せ、現時点ではこの挙動を採用
  - offscreen 合成の Retina ぼけは解消

## ペンディング

- 縦書きのパフォーマンスは、現状では run ごとの offscreen canvas `width/height` 再設定が支配的。
- 次の改善候補:
  - `mixed` / `sideways` ごとに main と同サイズの offscreen canvas を確保し、フレーム単位で再利用する。
  - フレーム先頭で orientation ごとの offscreen を 1 回だけ clear し、dirty rect のみを転写する。
