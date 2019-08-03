---
identifier: mdn-compat-scraper
title: Scraping Mozilla Developer Network compatibility tables
link: https://skalt.github.io/mdn-compat-table-scraper/
repo: https://github.com/skalt/mdn-compat-table-scraper/
---

<details open style="margin-left: 1ch"><summary>Background</summary>
Coming into 2018-19, Mozilla Developer Network (MDN) had crowdsourced HTML tables of compatibility between browsers and features of web standards.  They then crowdsourced the conversion of these tables into JSON.   
</details>

I wrote a [bookmarklet]({{ page.link }}) to scrape MDN's old browser compatibility tables. To use it,

1. go to a MDN documentation page which needs modernization
2. click the bookmarklet in your bookmarks menu/bar.
3. Check the scraped data in the JS console, including where you should submit it as a PR.

UPDATE 2019-08-01: as far as I know, the conversion to JSON compatibility tables is past the point of needing this tool.
