// ==UserScript==
// @name         APILimitMonitor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Monitor twitter api limit
// @author       https://twitter.com/kumakumaaaaa__
// @match        https://twitter.com/home
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// @license MIT
// ==/UserScript==

var notifiyPercents = [20, 50, 100];
var notifiyColors = ['#ff8888', '#ffff88', '#ffffff']

function initializePopup() {
    var div = document.createElement('div');
    div.innerHTML = '<div id="APILimitNotifier-container"></div>';
    document.body.appendChild(div);
    var styleElement = document.createElement('style');
    styleElement.innerHTML = `
    #APILimitNotifier-container {
        position: fixed;
        top: 120px;
        left: 20px;
        z-index: 1000;
    }
    .APILimitNotifier-notification {
        position: sticky;
        top: 0;
        left: 0;
        background: #FFF;
        border-radius: 4px;
        border: medium solid #000;
        cursor: pointer;
        -webkit-animation: APILimitNotifier-fadeOut 10s ease 0s forwards;
        animation: APILimitNotifier-fadeOut 10s ease 0s forwards;
        overflow: hidden;
    }
    @keyframes APILimitNotifier-fadeOut {
        0% { opacity: 0; height: 0px; }
        15% { opacity: 1; height: 5em; }
        85% { opacity: 1; height: 5em; border-width: 3px 3px; }
        100% { opacity: 0; height: 0px; border-width: 0px 3px; }
    }
    @-webkit-keyframes APILimitNotifier-fadeOut {
        0% { opacity: 0; height: 0px; }
        15% { opacity: 1; height: 5em; }
        85% { opacity: 1; height: 5em; border-width: 3px 3px; }
        100% { opacity: 0; height: 0px; border-width: 0px 3px; }
    }
    .APILimitNotifier-notification > ul {
        list-style: none;
        margin: 0;
        padding: .3em .8em 0 .8em;
    }`;
    document.head.appendChild(styleElement);
}

function displayPopup(urlName, limitRemaining, limitReset, limitLimit) {
    var containerElement = document.getElementById('APILimitNotifier-container');
    var limitRemainingPercent = Math.floor(limitRemaining / limitLimit * 100);
    var notificationElement = document.createElement('div');
    for (var i = 0; i < notifiyPercents.length; i++) {
        if (limitRemainingPercent <= notifiyPercents[i]) {
            notificationElement.style.backgroundColor = notifiyColors[i];
            break;
        }
    }
    var timeUntileRest = limitReset - Math.floor(Date.now() / 1000);
    notificationElement.classList.add('APILimitNotifier-notification');
    notificationElement.innerHTML = `<ul><li>${urlName}</li><li>Remaining: ${limitRemainingPercent}%</li><li>Rest: ${Math.floor(timeUntileRest / 6) / 10} min</li></ul>`
    containerElement.appendChild(notificationElement);
}

function storeLimit(urlName, limitRemaining, limitReset, limitLimit) {
    localStorage.setItem(urlName + '-limitRemaining', limitRemaining);
    localStorage.setItem(urlName + '-limitReset', limitReset);
    localStorage.setItem(urlName + '-limitLimit', limitLimit);
}

(function(open) {
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener("readystatechange", function() {
            if (this.readyState === 4 && this.status === 200 && this.getAllResponseHeaders().indexOf("x-rate-limit-remaining") >= 0 && this.getAllResponseHeaders().indexOf("x-rate-limit-reset") >= 0) {
                var limitLimit = Number(this.getResponseHeader("x-rate-limit-limit"));
                var limitRemaining = Number(this.getResponseHeader("x-rate-limit-remaining"));
                var limitReset = Number(this.getResponseHeader("x-rate-limit-reset"));
                var urlName = this.responseURL.split("?")[0].split("/").pop();
                displayPopup(urlName, limitRemaining, limitReset, limitLimit);
            }
        }, false);
        open.apply(this, arguments);
    };
})(XMLHttpRequest.prototype.open);


window.addEventListener("load", function() {
    initializePopup();
});

