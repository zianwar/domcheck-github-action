# DomCheck-GitHub-Action

Track DOM node and get notified when its value changes.  

Use cases includes checking some text on websites that doesn\'t support APIs, such as tracking a visa application status or amazon product price.

## Usage
Fork this repo and add your DOM checkers, you can define a **checker** with just a Javascript file, like this [`hackernews.checker.js`](https://github.com/zianwar/domcheck-github-action/blob/master/hackernews.checker.js):
```js
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
    const iftttWebhook = (event, key) => `https://maker.ifttt.com/trigger/${event}/with/key/${key}`;
    const url = new URL(iftttWebhook('_EVENT_', '_KEY_'));
    
    const success = `✓ ${name} status upated to '${value}'`
    const failure = `𝗑  Error running checker ${name}: '${error}'`
    const message = error ? failure : success;
    
    url.searchParams.append("value1", message);
    return axios.get(url.toString());
  }
});
```
### Setup Github Action

The [`action.yml`](https://github.com/zianwar/domcheck-github-action/blob/master/.github/workflows/action.yml) already inital contains code for setting up the action, you only need to:
1. Set your cron schedure
2. Add the part where you call your checkers that you created:

```yaml
name: 'DomCheck GitHub Action'

on:
  schedule:
    - cron: '0 19 * * *' # 7:00pm UTC = 11am PST

jobs:
  bot:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@master

      - name: Setup Node
        uses: actions/setup-node@v1
        with:
            node-version: '12.13.x'

      - name: Install npm dependencies
        run: yarn install
      
      - name: Run Hackernews domcheck Script
        run: node hackernews.checker.js
      
      # ADD YOUR CHECKERS HERE, same as the hackernews one above.
      # - name: Run Some Checker
      #   run: node someChecker.js

      - name: Commit Files
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add .
          git commit -m "Set history files"

      - name: Push Changes
        uses: ad-m/github-push-action@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

The script will scrape the `url` for the given `selector` in the config JSON file and will record values in a history file (CSV) `history` that will be committed automaticallty to your repository by Github Actions.

For example I have setup the [IFTTT webhook](https://ifttt.com/maker_webhooks) with Telegram to notify me upon changes, after running the checker and if the value has changed I'll get the following message in Telegram:

![IFTTT bot](https://i.imgur.com/pInm3qg.png)

## License
[MIT](https://github.com/zianwar/domcheck-github-action/blob/master/LICENSE)
