console.log("処理を開始します");

const fs = require("fs-extra"),
  moment = require("moment"),
  exifr = require("exifr"),
  _ = require("lodash");

const args = process.argv,
  from = args[2],
  to = args[3],
  format = args[4] || "YYYY-MM";

if (!fs.existsSync(from)) {
  console.log(`入力フォルダ(${from})が存在しません`);
  return;
}

if (!fs.existsSync(to)) {
  console.log(`出力フォルダ(${to})を作成します`);
  fs.mkdirsSync(to);
}

const moveFile = (fromFilePath, to, file, created) => {
    // YYYY-MM-DD HH.mm.ss形式にフォーマット
    const date = moment(created),
      formatted = date.format("YYYY-MM-DD HH.mm.ss"),
      // 元ファイルの拡張子を取得
      extention = _.last(file.split(".")),
      // YYYY-MM
      folder = date.format(format),
      folerPath = `${to}\\${folder}`;

    // YYYY-MMのフォルダを作る
    if (!fs.existsSync(folerPath)) {
      console.log(`年月フォルダ(${folder})を作成します`);
      fs.mkdirsSync(folerPath);
    }

    // 移動先ファイルのパスを決定する
    let toFilePath = `${folerPath}\\${formatted}.${extention}`,
      i = 0;
    while (fs.existsSync(toFilePath)) {
      i++;
      toFilePath = `${folerPath}\\${formatted}-${i}.${extention}`;
    }

    // 移動する
    console.log(`${fromFilePath} -> ${toFilePath}`);
    fs.moveSync(fromFilePath, toFilePath);
    return toFilePath;
  },
  files = fs.readdirSync(from),
  promises = files.map((file) => {
    const fromFilePath = `${from}\\${file}`;
    return exifr
      .parse(fromFilePath)
      .then((output) => {
        // 撮影日時でフォルダへ移動
        return moveFile(fromFilePath, to, file, output.DateTimeOriginal);
      })
      .catch(() => {
        // ファイル作成日時でフォルダへ移動
        const fileInfo = fs.statSync(fromFilePath);
        return moveFile(fromFilePath, to, file, fileInfo.mtime);
      });
  });

Promise.all(promises).then((results) => {
  console.log("処理を終わります");
});
