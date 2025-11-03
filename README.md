# PS88 samples

WIP

ビルド

```sh
npm install
npm run build
npm run test
npm run lint
npm run fmt
```

開発用コマンド

```sh
# ps88web をビルドし ./node_modules/ps88web/dist/index.html を生成
npm install --prefix ./node_modules/ps88web
npm run build --prefix ./node_modules/ps88web

# 開発用のローカルサーバー起動
npm run serve -- -p 8000

# ブラウザで以下の URL にアクセスするとサンプルが動作する
# http://localhost:8000/node_modules/ps88web/dist/?src=%2Fdist%2Fbass1.js

# ファイルの変更を監視し自動ビルド
npm run watch
```
