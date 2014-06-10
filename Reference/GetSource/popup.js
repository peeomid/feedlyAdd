/**
 * (c) 2013 Rob Wu <gwnRob@gmail.com>
 */

/* jshint browser:true, devel:true */
/* globals chrome, get_crx_url, get_zip_name, is_crx_url, getParam, openCRXasZip */
'use strict';
var cws_url;
var crx_url = getParam('crx');
var filename;

if (crx_url) {
    crx_url = get_crx_url(crx_url); // Normalize if needed.
    filename = get_zip_name(crx_url);
    ready();
} else {
    // Get CWS URL. On failure, close the popup
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function(tabs) {
        cws_url = tabs[0].url;
        crx_url = get_crx_url(cws_url);
        filename = get_zip_name(crx_url);
        if (!is_crx_url(crx_url)) {
            chrome.pageAction.hide(tabs[0].id);
            window.close();
            return;
        }
        ready();
    });
}

function ready() {
    document.getElementById('download').onclick = doDownload;
    document.getElementById('view-source').onclick = doViewSource;
}
var hasDownloadedOnce = false;
function doDownload() {
    if (hasDownloadedOnce) {
        console.log('Download is pending.');
        return;
    }
    openCRXasZip(crx_url, function(blob, publicKey) {
        tryTriggerDownload(blob, filename);
    }, function(errorMessage) {
        hasDownloadedOnce = false;
        console.error(errorMessage);
        alert('Error in CRX Viewer:\n\n' + errorMessage);
    }, onXHRprogress.bind(null, document.getElementById('download')));
    hasDownloadedOnce = true;
}
function doViewSource() {
    chrome.tabs.create({
        url: chrome.extension.getURL('crxviewer.html') +
            '?crx=' + encodeURIComponent(crx_url) +
            '&zipname=' + encodeURIComponent(filename),
        active: true
    });
}
function onXHRprogress(progressContainer, xhrProgressEvent) {
    var progressBar = progressContainer.querySelector('progress');
    if (!progressBar) {
        progressBar = document.createElement('progress');
        progressContainer.appendChild(progressBar);
    }
    if (xhrProgressEvent.lengthComputable) {
        progressBar.max = xhrProgressEvent.total;
        progressBar.value = xhrProgressEvent.loaded;
    } else {
        progressBar.removeAttribute('value');
    }
}

// Delegate download to background page to make sure that the download dialog shows up.
function tryTriggerDownload(blob, filename) {
    chrome.runtime.getBackgroundPage(function(bg) {
        bg.tryTriggerDownload(blob, filename);
        window.close();
    });
}

