// ==UserScript==
// @name         APILimitMonitor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Monitor twitter api limit
// @author       https://twitter.com/kumakumaaaaa__
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// @license MIT
// ==/UserScript==

var notifiyPercents = [20, 50, 100];
var notifiyColors = ['#ff8888', '#ffff88', '#ffffff']
var twitterBirdIconPaths = ['#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > header > div > div > div > div.css-1dbjc4n.r-1habvwh.r-e4l2kj.r-1rnoaur > div.css-1dbjc4n.r-dnmrzs.r-1vvnge1 > h1 > a', '#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > header > div > div > div > div.css-1dbjc4n.r-1awozwy.r-e4l2kj.r-1rnoaur > div.css-1dbjc4n.r-dnmrzs.r-1vvnge1 > h1 > a']

function waitForElement(selectFunction, interval) {
    return new Promise((resolve) => {
        const intervalId = setInterval(() => {
            const element = selectFunction();
            if (element) {
                clearInterval(intervalId);
                resolve(element);
            }
        }, interval);
    });
}

function initializePopup() {
    var div = document.createElement('div');
    div.innerHTML = '<div id="APILimitNotifier-container"></div>';
    document.body.appendChild(div);
    var styleElement = document.createElement('style');
    styleElement.innerHTML = `
    #APILimitNotifier-container {
        position: fixed;
        top: 70px;
        left: 10px;
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
        overflow: hidden;
    }
    .APILimitNotifier-notification > ul {
        list-style: none;
        margin: 0;
        padding: .3em .8em 0 .8em;
    }`;
    document.head.appendChild(styleElement);
}

function displayPopup(limits) {
    waitForElement(() => document.getElementById('APILimitNotifier-container'), 500)
        .then((containerElement) => {
            containerElement.innerHTML = '<div id="APILimitNotifier-container"></div>';
            var displayNum = 3;
            for (let index = 0; index < Math.min(displayNum, limits.length); index++) {
                var [urlName, limitRemaining, limitReset, limitLimit, limitRemainingPercent] = limits[index];
                var notificationElement = document.createElement('div');
                for (var j = 0; j < notifiyPercents.length; j++) {
                    if (limitRemainingPercent <= notifiyPercents[j]) {
                        notificationElement.style.backgroundColor = notifiyColors[j];
                        break;
                    }
                }
                var timeUntileRest = limitReset - Math.floor(Date.now() / 1000);
                notificationElement.classList.add('APILimitNotifier-notification');
                notificationElement.innerHTML = `<ul><li>${urlName}</li><li>Remaining: ${limitRemainingPercent}%</li><li>Rest: ${Math.floor(timeUntileRest / 6) / 10} min</li></ul>`
                if (containerElement !== null) {
                    containerElement.appendChild(notificationElement);
                }
            }
        })
        .catch((error) => {
            console.log('要素が見つかりませんでした:', error);
        });
}

function storeLimit(urlName, limitRemaining, limitReset, limitLimit) {
    localStorage.setItem(urlName + '-limitRemaining', limitRemaining);
    localStorage.setItem(urlName + '-limitReset', limitReset);
    localStorage.setItem(urlName + '-limitLimit', limitLimit);
}

function displayLimitRemainingPercent(limitRemainingPercent) {
    twitterBirdIconPaths.forEach((twitterBirdIconPath) => {
        waitForElement(() => document.querySelector(twitterBirdIconPath), 500)
            .then((twitterBirdIcon) => {
                var color = '#88ff88';//green
                if (limitRemainingPercent <= 20)
                    color = '#ff8888';//red
                twitterBirdIcon.style.background = `linear-gradient(white ${100 - limitRemainingPercent}%, ${color} ${100 - limitRemainingPercent}%)`;
            })
            .catch((error) => {
                console.log('要素が見つかりませんでした:', error);
            });
    })
}

function updateDisplay() {
    var limits = []
    for (let i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.includes('-limitRemaining')) {
            var urlName = key.replace('-limitRemaining', '');
            var limitRemaining = Number(localStorage.getItem(urlName + '-limitRemaining'));
            var limitReset = Number(localStorage.getItem(urlName + '-limitReset'));
            var limitLimit = Number(localStorage.getItem(urlName + '-limitLimit'));
            var limitRemainingPercent = Math.floor(limitRemaining / limitLimit * 100);
            if (Math.floor(Date.now() / 1000) < limitReset) {
                limits.push([urlName, limitRemaining, limitReset, limitLimit, limitRemainingPercent]);
            }
        }
    }
    var limitRemainingPercentIndex = 4;
    limits.sort(function(a,b){return(a[limitRemainingPercentIndex] - b[limitRemainingPercentIndex]);});
    displayLimitRemainingPercent(limits[0][limitRemainingPercentIndex]);
    displayPopup(limits);
}

function addToggleFunction() {
    twitterBirdIconPaths.forEach((twitterBirdIconPath) => {
        waitForElement(() => document.querySelector(twitterBirdIconPath), 500)
            .then((twitterBirdIcon) => {
                var containerElement = document.getElementById('APILimitNotifier-container');
                twitterBirdIcon.addEventListener('click', function(event) {
                    event.preventDefault();
                });
                twitterBirdIcon.onclick = function () {
                    if (containerElement.style.display === 'none') {
                        containerElement.style.display = 'block';
                    }
                    else {
                        containerElement.style.display = 'none';
                    }
                };
            })
            .catch((error) => {
                console.log('要素が見つかりませんでした:', error);
            });
    })
}

(function(open) {
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener('readystatechange', function() {
            if (this.readyState === 4 && this.status === 200 && this.getAllResponseHeaders().indexOf('x-rate-limit-remaining') >= 0 && this.getAllResponseHeaders().indexOf('x-rate-limit-reset') >= 0) {
                var limitLimit = Number(this.getResponseHeader('x-rate-limit-limit'));
                var limitRemaining = Number(this.getResponseHeader('x-rate-limit-remaining'));
                var limitReset = Number(this.getResponseHeader('x-rate-limit-reset'));
                var urlName = this.responseURL.split('?')[0].split('/').pop();
                storeLimit(urlName, limitRemaining, limitReset, limitLimit);
                updateDisplay();
            }
        }, false);
        open.apply(this, arguments);
    };
})(XMLHttpRequest.prototype.open);

window.addEventListener('load', function() {
    initializePopup();
    addToggleFunction();
    updateDisplay();
});
