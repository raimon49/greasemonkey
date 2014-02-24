// ==UserScript==
// @name           UrlCleaner
// @description    URL から不要なパラメーターを削除し、リダイレクトします。
// @namespace      http://github.com/ussy/
// @include        http://*?*
// @include        http://*#*
// @include        https://*?*
// @include        https://*#*
// @require        https://gist.github.com/raw/34615/d818892d070ea57762e299765ecbc48efec90f0a/gistfile1.js
// @author         Ussy
// @version        1.1.2
// ==/UserScript==
if (window != window.parent) {
  return;
}

const DATABASE_URLs = [
  "http://wedata.net/databases/UrlCleaner/items.json",
  "http://wedata.github.com/UrlCleaner/items.json",
];
var databases = [];
DATABASE_URLs.forEach(function(url) {
  databases.push(new Wedata.Database(url));
});

GM_registerMenuCommand("UrlCleaner - clear cache", function() {
  databases.forEach(function(database) {
    database.clearCache();
  });
});

var link = document.querySelector("link[rel=canonical]");
if (link && link.href == location.href) {
  return;
}

const SITEINFO = [
  /*
  { // Google Analytics
    url: "^https?://[^?#]+[?#].*\\butm_(?:c(?:ampaign|ontent)|medium|source|term)\\b",
    kill: "utm_campaign utm_content utm_medium utm_source utm_term"
  },
  { // YouTube
    url: "^http://www\\.youtube\\.com/watch\\?",
    live: "v"
  }
  */
];

var delimiter = /[&;]/.exec(location.search.substring(1) + location.hash.substring(1)) || "&";
function tryRedirect(data) {
  if (!(new RegExp(data.url).test(location.href))) {
    return;
  }

  var newURL = location.href.replace(/[?#].*/, "");
  var rescues = typeof data.live == "string" && data.live.split(/\s+/);
  var killers = typeof data.kill == "string" && data.kill.split(/\s+/);
  var queries = [];
  var fragments = [];
  var newQuery = location.search.substring(1).split(delimiter).filter(function(v) filterByKeys(v, queries), "").join(delimiter);
  var newFragment = location.hash.substring(1).split(delimiter).filter(function(v) filterByKeys(v, fragments), "").join(delimiter);

  if (queries.length == 0 && newQuery) {
    newURL += "?" + newQuery;
  } else if (queries.length > 0) {
    newURL += "?" + queries.join(delimiter);
  }

  if (fragments.length == 0 && newFragment) {
    newURL += "#" + newFragment;
  } else if (fragments.length > 0) {
    newURL += "#" + fragments.join(delimiter);
  }

  if (newURL != location.href) {
    location.href = newURL;
  }

  function filterByKeys(v, survivors) {
    var [key, ] = v.split("=", 2);
    if (!key) {
      return true;
    }

    if (rescues && rescues.indexOf(key) > -1) {
      survivors.push(v);
      return false;
    }

    return typeof killers.indexOf == "function" && killers.indexOf(key) == -1;
  }
}

SITEINFO.forEach(tryRedirect);

databases.forEach(function(database) {
  database.get(function(items) {
    items.forEach(function(item) {
      tryRedirect(item.data);
    });
  });
});
