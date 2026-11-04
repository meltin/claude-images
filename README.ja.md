# Claude Images

[English](README.md) | 日本語

チャットで画像を扱うための Claude Code の mod です。Claude が画像を見せる機能と、貼り付けた画像をサムネイルで確認する機能があります。

![Claude がページのスクリーンショットを撮り、チャットの中にインラインで表示している。画像の下には Open in Preview ボタンがある](docs/shown.png)

**Claude が見せる画像**: この mod は `show_image` というツールを Claude に追加します。Claude が PNG のパスを渡してこのツールを呼ぶと、ツールの結果行の代わりに画像がチャットに表示され、下に「Open in Preview」ボタンが付きます。見た目に関わる作業のあとは頼まれなくても使うよう、ツールの説明文で指示しています。そのため Claude は、ページのスクリーンショットを撮ったり（headless Chrome や Playwright）、チャートやデザインを描いたりしたあと、ファイルを開くよう頼まずにその場で結果を見せます。

![貼り付けた画像がプロンプトの上にサムネイルとして表示され、タグと対応する番号が付いている](docs/pasted.png)

**貼り付けた画像**: プロンプトに画像を貼り付けると、`[Image #1]` というタグが付くだけでなく、入力欄の上にサムネイルも表示されます。サムネイルの下の番号を押すと、その画像を Preview で開けます。

## インストール

Claude Code の中で次を実行します。

```
/plugin install images --marketplace ixxq/claude-images
```

marketplace の追加を `y` で承認し、スコープを選んでから、`/reload-plugins` を実行するか新しいセッションを開始してください。

## 仕様

- サムネイル: 高さは 6 行で、横に入りきらない分は `+N` とまとめて表示します。端末の高さが足りないとサムネイルの帯がスクロールしてしまうので、帯が収まる余裕を残してください。
- `show_image(path, title?)`: 絶対パスで指定した 2 MiB 以下の PNG を、縦横比を保ったままチャットの幅に合わせて表示します。「Open in Preview」は macOS の `open -a Preview` で開きます。
- 機能はこれだけです。動画、履歴、テレメトリ、自動更新はありません。コードは全体で 300 行ほどです。

## 対応する端末

画像は、Claude Code 本体の `Image` 要素が描画できる端末で表示されます。Ghostty、kitty、Orca など、kitty graphics protocol に対応した端末です。それ以外の端末では、画像の代わりに alt テキスト（`[Image #1]` や `[image: title]`）が表示されます。

PNG 以外の画像（ブラウザからコピーした JPEG など）は、貼り付けたときに `sips` で一度だけ PNG に変換します。そのためサムネイルの表示には macOS が必要で、Linux ではそのサムネイルに `no preview` と表示されます。

## 開発

```
claude plugin validate .
claude plugin test .
```

フォルダから直接インストールしておけば、編集を `/reload-plugins` で反映できます。

```
claude plugin marketplace add ~/dev/oss/claude-images
claude plugin install images@claude-images
```

## ライセンス

MIT
