"use strict";

var optionGlobal = {
    options: {}
}

function main() {
    loadOptions();
    loadProfileData();

}

// This function is from Feedly Notifier
function loadProfileData() {
    chrome.runtime.getBackgroundPage(function(backgroundPage){
        backgroundPage.apiRequestWrapper("profile", {
            useSecureConnection: backgroundPage.appGlobal.options.useSecureConnection,
            onSuccess: function (result) {
                console.log('success Profile');
                var userInfo = document.getElementById('userInfo');
                // userInfo.find("[data-locale-value]").each(function () {
                //     var textBox = $(this);
                //     var localValue = textBox.data("locale-value");
                //     textBox.text(chrome.i18n.getMessage(localValue));
                // });
                // userInfo.show();
                userInfo.classList.remove('hide');
                for (var profileData in result) {
                    var matchItem = userInfo.querySelector("span[data-value-name='" + profileData + "']");
                    if (matchItem != null) {
                        matchItem.innerHTML = result[profileData];
                    };
                    // userInfo.find("span[data-value-name='" + profileData + "']").text(result[profileData]);
                }
            },
            onAuthorizationRequired: function () {
                // $("#userInfo, #filters-settings").hide();
                var userInfo = document.getElementById('userInfo');
                userInfo.classList.add('hide');
                // console.log(backgroundPage);
                // console.log('required');
            }
        });
    });
}

function loadOptions() {
    // Load options from chrome storage to optionGlobal
    chrome.storage.sync.get(null, function(options){
        for (var option in options) {
            optionGlobal[option] = options[option];
        }
    });
}
// Init on DOM ready.
document.addEventListener('DOMContentLoaded', main);