const domcheck = require('./domcheck');
const axios = require('axios');

domcheck({
  /**
   * name [required] Name of the checker.
   */
  name: 'hackernews',

  /**
   * url [required] The URL of the website to scrap using [Puppeeter](https://developers.google.com/web/tools/puppeteer)
   */
  url: 'https://news.ycombinator.com/',

  /**
   * history [optional] The path to the history file that records DOM node values,
   * this file is checked everytime the code runs to compare the current value against old values,
   * and notify in case it has changed.
   * This file is store in the `historyDir` which have `history` as default folder name,
   * you can override it by setting the `historyDir: 'data'` property.
   */
  history: 'hackernews.csv',

  /**
   * waitForSelector [required] DOM selector to wait for to load before scraping.
   */
  waitForSelector: '.itemlist tr:first-child .title a',

  /**
   * onDocument [optional] Function that specifies how to get the DOM data from the url,
   * by default it will just query the `waitForSelector`.
   *
   * @param {string} selector This the same as the `waitForSelector`.
   */
  onDocument: (selector) => {
    const nodeList = document.querySelectorAll(selector);
    return nodeList[0] && nodeList[0].innerText.trim();
  },

  /**
   * notify [required] Function that defines how you will get notified with the result,
   * below is an example using IFTTT webhook to get notified via Telegram.
   *
   * @param {string} name The name of this checker, same as the `name` property.
   * @param {string} value The the new value of the dom node.
   * @param {string} error The error message if any error happened.
   */
  notify: (name, value, error) => {
    const success = `✓ ${name} status upated to '${value}'`;
    const failure = `𝗑  Error running checker ${name}: '${error}'`;
    const message = error ? failure : success;
    console.log('Notification:', message);

    /*
    const iftttWebhook = (event, key) => `https://maker.ifttt.com/trigger/${event}/with/key/${key}`;
    const url = new URL(iftttWebhook('_EVENT_', '_KEY_'));

    url.searchParams.append("value1", message);
    return axios.get(url.toString());
    */
  }
});
