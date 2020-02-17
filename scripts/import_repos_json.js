#!/usr/bin/env node
// const fs = require("fs");
const https = require("https");
const process = require("process");
const toStdout = str => process.stdout.write(str);
let searches = process.argv
  .slice(process.argv.findIndex(arg => arg.includes("github.io")) + 1)
  .map(s => new RegExp(s, "ig"));
searches = searches.length ? searches : [/.*/gi];
let url = "https://api.github.com/users/SKalt/repos";
const get = url =>
  new Promise((resolve, reject) => {
    https.get(
      {
        hostname: "api.github.com",
        path: "/users/SKalt/repos",
        headers: { "User-Agent": "skalt" }
      },
      response => {
        let buffer = "";
        response.on("data", chunk => (buffer += chunk));
        response.on("end", () => {
          resolve(JSON.parse(buffer));
        });
      }
    );
  });

get(url)
  .then(json =>
    json
      .filter(
        repo =>
          !repo.fork &&
          !repo.private &&
          searches.some(search => search.test(repo.name))
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(repo => ({
        identifier: repo.name,
        title: repo.name,
        description: repo.description,
        link: repo.homepage,
        repo: repo.html_url,
        date: repo.created_at.slice(0, 10),
        updated_at: repo.updated_at.slice(0, 10),
        archived: repo.archived
      }))
  )
  .then(str => toStdout(JSON.stringify(str, null, 2)));
