# Grapheme-safe lineBreak 修正計画

## 背景

- `lineBreakWithCharMetrixes()` は `css-line-break` の `Break.start/end` をそのまま `charMetrixes.slice(start, end)` に使っている。
- `css-line-break` が返す境界は `code point` 単位、`charMetrixes` は `splitText()` により `grapheme` 単位。
- そのため ZWJ emoji を含むテキストで、改行文字 `\n` を含む語の末尾判定と `LineMetrix.at` の進み方が壊れる。
- 既存の失敗テストは `src/drawText/breakLine.test.ts` の ZWJ newline 系 4 件（Chromium/WebKit 各 2 件）で再現している。

## 目標

- 公開 API は変更しない。
- `lineBreakWithCharMetrixes(text, charMetrixes, maxWidth, forceOverflowWrap)` の返り値の意味を維持したまま、`grapheme` を壊さない語分割に修正する。
- ZWJ emoji と改行の組み合わせでも、`LineMetrix.at` と改行検知が正しく動くことをテストで固定する。
- 既存の非 ZWJ ケース、`overflowWrap`、空文字、通常改行ケースを壊していないことを確認する。

## 非目標

- `css-line-break` 依存の置き換え。
- 縦書き時の browser 実装差分（`verticalText.test.ts` の Issue C）の解消。
- `lineBreakWithCharMetrixes` の公開シグネチャ変更。

## 実装方針（要点）

- `css-line-break` は引き続き break opportunity の列挙器として使う。
- ただし `Break` 1 件をそのまま 1 語として扱わず、`code point` 境界を `grapheme` 境界に変換するアダプタ層を `breakLine.ts` 内に追加する。
- `charMetrixes[].textChar` から各 grapheme の `code point` 長を前計算し、累積配列を作る。
- `LineBreaker` から得た `Break.end` が grapheme 境界に一致しない場合は、次の `Break` を読み足して、境界に乗るまでマージする。
- `Word.length` は `code point` 差分ではなく、実際に消費した grapheme 数を使う。
- `word.chars.at(-1)?.textChar === '\n'` の既存改行判定は維持し、末尾の grapheme が正しく `\n` になるようにする。

## Doc-First Phase

### Phase 1: API 設計・ドキュメント作成

- 公開 API 変更なしを明確化する。
- このリポジトリには `packages/*/docs/` がないため、外部 IF の追加ドキュメントは不要。
- ただしユーザー向けの振る舞い説明を補足したくなった場合のみ、`README.md` の折り返し説明に「grapheme-safe な改行処理」を追記する。
- 設計上の新しい内部不変条件をこの計画に明記する。
  - `Break` は `code point` 単位でも、`Word` は常に grapheme 全体を含む。
  - `LineMetrix.at` は常に `charMetrixes` の index（grapheme index）で進む。

### Phase 2: 利用イメージレビュー

- 利用側 API は変わらないため、確認対象は既存呼び出しの互換性。
- 確認ポイント:
  - `measureStyledText()` からの呼び出しは変更不要。
  - `drawStyledText()` の `preMedured` あり/なし双方で `lineBreaks` の互換性が維持される。
  - 既存利用者が追加引数や設定変更なしで修正版の恩恵を受ける。
- レビュー観点:
  - `LineMetrix.at` を参照する後続処理（`computeLineText` 系）が grapheme index 前提でそのまま動くこと。

### Phase 3: 実装

- `src/drawText/breakLine.ts`
  - grapheme ごとの `code point` 長と累積境界を作るヘルパーを追加する。
  - `LineBreaker` の `Break` を、grapheme 境界まで拡張して `Word` に変換するヘルパーへ置き換える。
  - `splitWordByMaxWidth()` は引き続き grapheme 単位で動かす。
  - `forceOverflowWrap` の既存制御フローは変えず、`Word.length` の意味だけ揃える。
- `src/drawText/breakLine.test.ts`
  - 既存 ZWJ newline 失敗ケースを維持して green 化する。
  - 追加テストを入れる。
    - ZWJ を含まない通常ケースが従来どおり動く確認。
    - 単一 ZWJ emoji のみを含むテキストで余計な行分割が起きない確認。
    - ZWJ emoji の直後に通常折り返しが発生するケースで `at` が grapheme index 基準で進む確認。
    - 複数 ZWJ emoji と `forceOverflowWrap=true` の組み合わせで無限ループしない確認。
    - 結合文字列（例: combining mark を含む文字列）で grapheme 境界を壊さないケースを 1 件追加するか検討。
- テスト実行:
  - まず `pnpm vitest run src/drawText/breakLine.test.ts`
  - その後 `pnpm vitest run`

### Phase 4: アーキテクトレビュー

- 確認項目:
  - `breakLine.ts` 内で index の意味が一貫しているか（code point と grapheme の混在が残っていないか）。
  - 既存の通常ケースで返り値の意味が変わっていないか。
  - `README` を更新した場合は実装と整合しているか。
  - `drawTextLines.ts` 側の呼び出し前提（`splitText` -> `charMetrixes` -> `lineBreaks`）と矛盾しないか。

## テスト戦略

### 既存テストを使う観点

- 既存の基本ケース:
  - 単一行
  - 通常折り返し
  - `\n` による強制改行
  - 空文字
  - `forceOverflowWrap`
- 既存の Safety Tests:
  - 無限ループ防止
  - `maxWidth` を広く振った簡易ストレス

### 追加したいテスト

- `Break` 境界が grapheme 境界とずれるケースを明示的に増やす。
- 追加候補:
  - `"A🐈‍⬛B\nC"` の `at` 値だけでなく、2 行目の `width` も検証。
  - `"🐈‍⬛\nX"` のように ZWJ が行頭にあるケース。
  - `"e\u0301\nX"` のような combining sequence を `splitText()` 経由で扱うケース。
  - `"A🐈‍⬛B C"` で `maxWidth` を調整し、ZWJ の途中で分割されず、次の単語境界で折り返されるケース。
  - `forceOverflowWrap=true` でも ZWJ grapheme 1 個を内部で分断しないケース。

### 回帰確認の基準

- 失敗していた ZWJ newline テストが通る。
- `breakLine.test.ts` の既存グリーン部分は維持。
- フルテストで `verticalText.test.ts` の既知失敗以外を増やさない。

## パフォーマンス影響の考察

- 追加コスト:
  - 各呼び出しで `charMetrixes` を 1 回走査し、各 grapheme の `code point` 長を数える処理が入る。
  - `Break.end` が grapheme 境界に一致しないケースでは、複数 `Break` をまとめるため `breaker.next()` 呼び出しが増える。
- オーダー:
  - 累積境界作成は `O(n)`（`n = grapheme 数`）。
  - `Break` の走査も全体では各 `Break` を高々 1 回ずつ消費するため、総計 `O(n + m)` に収まりやすい（`m = code point 数`）。
  - 既存実装も `LineBreaker` 自体は全文を走査するので、漸近オーダーは大きく変わらない。
- 実効コスト:
  - ASCII 中心ではほぼ境界一致するため、追加コストは累積境界前計算ぶんが主。
  - ZWJ/combining を多く含む文字列ではマージ処理が増えるが、対象文字数自体は短文用途が中心なら許容範囲の見込み。
- ガード:
  - 新規ロジックは while ループの進行条件を明確にし、`Break` を消費できないケースを作らない。
  - 既存の簡易時間チェックに加え、ZWJ を含む長めの入力でも終了するテストを追加する。
- 任意の追加確認:
  - 実装後、`Date.now()` ベースの粗い比較で `breakLine.test.ts` 内に 1 件だけ回帰確認を入れることはできるが、CI の揺れを考えると厳密な性能閾値テストは避ける。

## 受け入れ条件

- `pnpm vitest run src/drawText/breakLine.test.ts` が通る。
- `pnpm vitest run` で `breakLine.test.ts` に新規失敗がない。
- 既知の `verticalText.test.ts` の browser 依存失敗を除き、新しい失敗を増やさない。
- 返り値の `LineMetrix.at` が grapheme index として一貫する。

## 実装結果

- `breakLine.ts` に grapheme ごとの code point 境界マップを追加し、`css-line-break` の `Break` を grapheme 境界までマージしてから `Word` に変換するよう修正した。
- `breakLine.test.ts` に ZWJ newline の幅確認、複数 ZWJ の `at` 確認、`forceOverflowWrap` 時に ZWJ を壊さない回帰、combining mark 回帰を追加した。
- `test-setup.ts` に `export {}` を追加し、top-level `await` を含むテストセットアップを module として扱うよう修正した。
- `pnpm vitest run src/drawText/breakLine.test.ts` は通過した。
- `pnpm vitest run` は既知の `verticalText.test.ts` の Chromium 1 件のみ失敗で、`breakLine` 起因の新規失敗は増えていない。
- `pnpm exec tsc --noEmit` は通過した。

## 実装時の調整内容（補足）

- `css-line-break` の依存自体は維持し、置き換えは見送った。
- パフォーマンス確認はアルゴリズム上のオーダーと既存テストの終了性確認に留め、厳密なベンチマークテストは追加していない。
