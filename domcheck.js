const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const csv = require("fast-csv");
const some = require("lodash/some");
const last = require("lodash/last");
const isEmpty = require("lodash/isEmpty");
const isNil = require("lodash/isNil");
const merge = require("lodash/merge");

function query(url, waitForSelector, onDocument) {
  return puppeteer.launch({ headless: true }).then(browser => {
    return browser.newPage().then(page => {
      return page
        .goto(url)
        .then(() => page.waitForSelector(waitForSelector))
        .then(() => page.evaluate(onDocument))
        .finally(() => browser.close());
    });
  });
}

function getHistory(dir, filename) {
  const filepath = path.join(__dirname, dir, filename);
  console.log("loading logs from", filepath);

  if (!fs.existsSync(filepath)) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const rows = [];
    csv
      .parseFile(filepath, { headers: true })
      .on("error", error => reject(error))
      .on("data", row => rows.push(row))
      .on("end", () => resolve(rows));
  });
}

function setHistory(dir, filename, rows) {
  const filepath = path.join(__dirname, dir, filename);
  return fs.ensureFile(filepath).then(
    () =>
      new Promise((resolve, reject) => {
        csv
          .writeToPath(filepath, rows, { headers: true })
          .on("error", error => reject(error))
          .on("end", () => resolve());
      })
  );
}

const defaultConfig = {
  historyDir: "history",
  onDocument: (selector) => {
    const nodeList = document.querySelectorAll(selector);
    return nodeList[0] && nodeList[0].innerText.trim();
  }
};

function domcheck(config) {
  const {
    name,
    url,
    waitForSelector,
    onDocument,
    history,
    historyDir,
    notify
  } = merge(defaultConfig, config);

  if (some([name, url, onDocument, history, notify], x => isNil(x))) {
    throw new Error("missing parameters");
  }

  return query(url, waitForSelector, onDocument)
    .then(text => {
      if (isEmpty(text)) throw new Error(`query result is empty`);

      return getHistory(historyDir, history).then(entries => {
        const lastEntry = last(entries);
        console.log("last entry:", lastEntry);

        entries.push({ text, timestamp: Date.now() });
        const promises = [setHistory(historyDir, history, entries)];

        if (!lastEntry || (lastEntry && lastEntry.text !== text)) {
          console.log("notifying change:", text);
          promises.unshift(notify(name, text, null));
        }

        return Promise.all(promises);
      });
    })
    .catch(error => {
      console.log("Error:", error);
      return notify(name, null, error);
    });
}

module.exports = domcheck;
