// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// var popupGlobal = {
//     backgroundPage: chrome.extension.getBackgroundPage()
// };

function feedLink(url) {
  var feed_link = document.createElement('a');
  feed_link.href = url;
  feed_link.addEventListener("click", onClick);
  return feed_link;
}

// <div class="collectionItem">
//                 <input type="checkbox" name="" value="">
//                 <span></span>
//             </div>
function categoryCheckbox(category) {
    // One category returned from feedly
    // Should contain id and label
    // console.log('1 cate');
    // console.log(category);
    var collectionItem = document.createElement('div');
    collectionItem.className = "collectionItem";

    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.name = "category";
    checkbox.value = category.id;
    // checkbox.id = category.id;

    var spanTitle = document.createElement('span');
    spanTitle.innerHTML = capitaliseFirstLetter(category.label);

    collectionItem.appendChild(checkbox);
    collectionItem.appendChild(spanTitle);

    return collectionItem;
}

// Create a category list (checkboxes)
function generateCategoryList(categories){
    // console.log('all cate');
    // console.log(categories);
    var collectionList = document.createDocumentFragment('div');

    for (var category in categories) {
        collectionList.appendChild(categoryCheckbox(categories[category]));
    }

    return collectionList;
}

function main() {
    dipslayFeedList();

    var loginButton = document.getElementById('login-btn');
    chrome.runtime.getBackgroundPage(function(backgroundPage){
        loginButton.addEventListener("click", backgroundPage.getAccessToken);
    });

    var subscribeButton = document.getElementById('subscribe');
    subscribeButton.addEventListener("click", subscribeSelectedItem);

    var backButtons = document.getElementsByClassName('back-btn');
    for (var i = 0; i < backButtons.length; i++) {
        backButtons[i].addEventListener("click", function(){
            showElement('content');
        });
    }

}

function subscribeSelectedItem () {
    var selectedCategories = getCheckedBoxes("category"),
        storedLink = document.getElementById('clickedLink'),
        title = '';

    subscribeFeed(storedLink.value, selectedCategories, title);
}

function dipslayFeedList() {
    chrome.tabs.getSelected(function(tab) {
    chrome.storage.local.get(tab.id.toString(), function(result) {
      var feeds = result[tab.id];
      // if (feeds.length == 1) {
      //   // Only one feed, no need for a bubble; go straight to the subscribe
      //   // page.
      //   //preview(feeds[0].href);
      // } else {
        var content = document.getElementById('content');
        var heading = document.getElementById('heading');
        heading.innerText = "Click to subscribe... ";
        // var heading = document.getElementById('heading');
        // heading.innerText =
        //     chrome.i18n.getMessage("rss_subscription_action_title");
        content.appendChild(document.createElement('br'));

        var feed_list = document.createElement('table');
        feed_list.style.width = "400";
        for (var i = 0; i < feeds.length; ++i) {
          // Create an RSS image and the anhor encapsulating it.
          var img_link = feedLink(feeds[i].href);
          var img = document.createElement('img');
          img.src = "icon-16.png";
          img_link.appendChild(img);

          // Create a text node and the anchor encapsulating it.
          var text_link = feedLink(feeds[i].href);
          text_link.appendChild(document.createTextNode(feeds[i].title));

          // Add the data to a row in the table.
          var tr = document.createElement('tr');
          tr.className = "feedList";
          var td = document.createElement('td');
          td.width = "16";
          td.appendChild(img_link);
          var td2 = document.createElement('td');
          td2.appendChild(text_link);
          tr.appendChild(td);
          tr.appendChild(td2);
          feed_list.appendChild(tr);
        // }

        content.appendChild(feed_list);
      }
    });
  });
}

function onClick(event) {
  var a = event.currentTarget;
  chrome.runtime.getBackgroundPage(function(backgroundPage){
    var isLoggedIn = backgroundPage.appGlobal.isLoggedIn;

    // preview(a.href);
    console.log('click a');
    console.log(a);
    if (isLoggedIn) {
        var collectionList = document.getElementById('collectionList');
        if (!collectionList.firstElementChild) {
            var storedLink = document.getElementById('clickedLink');
            storedLink.value = a.href;
            //load categories then display them
            displayCategoryList();
            // loadUserCategories(function(){

            // });
        }
        showElement('addSubscription');
    } else {
        showElement('login');
    }
  });
}

// Display category list html
function displayCategoryList () {
    var collectionList = document.getElementById('collectionList');
    // categoryList = chrome.storage.sync.get("categories_html"),

    // "categories_html"
    chrome.storage.sync.get("categories_raw", function(result) {
        // console.log('result');
        // console.log(result);
        // remove all child nodes
        while (collectionList.firstChild) {
            collectionList.removeChild(collectionList.firstChild);
        }
        // console.log('hehe');
        // console.log(typeof categoryList);
        // console.log(categoryList);
        // console.log(unescape(categoryList['categories_html']));
        // Then add newly generated list
        var category_html = generateCategoryList(result['categories_raw']);
        // console.log(category_html);
        // console.log(collectionList);
        collectionList.appendChild(category_html);
    });
}

function preview(feed_url) {
  // See if we need to skip the preview page and subscribe directly.
  var url = "";
  if (window.localStorage && window.localStorage.showPreviewPage == "No") {
    // Skip the preview.
    url = window.localStorage.defaultReader.replace("%s", escape(feed_url));
  } else {
    // Show the preview page.
    url = "subscribe.html?" + encodeURIComponent(feed_url);
  }
  chrome.tabs.create({ url: url });
  window.close();
}

function showElement(toShow) {
    // To hide all element and show only passed one
    var elements = {
            content: document.getElementById('content'),
            login: document.getElementById('login'),
            addSubscription: document.getElementById('addSubscription'),
            message: document.getElementById('message')
        };

    // Hide all items
    for (var element in elements) {
        elements[element].classList.add('hide');
    }

    elements[toShow].classList.remove('hide');
}

// This function is from Feedly Notifier
function loadUserCategories(callback){
    chrome.runtime.getBackgroundPage(function(backgroundPage){
        backgroundPage.apiRequestWrapper("categories", {
            onSuccess: function (result) {
                console.log('load cate');
                console.log(result);
                // var category_html = escape(categoryList(result));
                // console.log(category_html);
                chrome.storage.sync.set({
                                categories_raw: result
                                // categories_html: category_html
                            }, function () {
                                // Run callback function after retrieving
                                if (typeof callback === "function") {
                                    callback();
                                }
                            });
                // appendCategory(chrome.extension.getBackgroundPage().appGlobal.globalUncategorized, "Uncategorized");
            }
        });
    });
}

function subscribeFeed (feedUrl, checkedCategories, title) {
    var body = {};
    if (title !== undefined || !title) {
        body['title'] = title;
    };

    body["id"] = "feed/" + feedUrl;

    chrome.storage.sync.get("categories_raw", function(result){
        var allCategories = result["categories_raw"],
            bodyCategory = [];
        console.log(allCategories);
        console.log(checkedCategories);
        for (var category in allCategories) {

            if (checkedCategories.indexOf(allCategories[category]["id"]) != -1) {
                bodyCategory.push(allCategories[category]);
            };
        }

        if (bodyCategory.length != 0) {
            body["categories"] = bodyCategory;
        };

        // console.log(body);
        // console.log(JSON.stringify(body));

        chrome.runtime.getBackgroundPage(function(backgroundPage){
            backgroundPage.apiRequestWrapper("subscriptions", {
                method: 'POST',
                body: body,
                onSuccess: function(response){
                    console.log('success sub');
                    console.log(response);
                    showElement('message');
                },
                onError: function(response){
                    console.log('error');
                    console.log(response);
                    var messageContent = document.getElementById('messageContent');
                    messageContent.innerHTML = "Error!";
                    showElement('message');
                }
            });
        });
    });
}

// Pass the checkbox name to the function
// Get this from stackoverflow:
// http://stackoverflow.com/questions/8563240/how-to-get-all-checked-checkboxes
function getCheckedBoxes(chkboxName) {
  var checkboxes = document.getElementsByName(chkboxName);
  var checkboxesChecked = [];
  // loop over them all
  for (var i=0; i<checkboxes.length; i++) {
     // And stick the checked ones onto an array...
     if (checkboxes[i].checked) {
        checkboxesChecked.push(checkboxes[i].value);
     }
  }
  // Return the array if it is non-empty, or null
  return checkboxesChecked.length > 0 ? checkboxesChecked : null;
}

// http://stackoverflow.com/questions/1026069/capitalize-the-first-letter-of-string-in-javascript
function capitaliseFirstLetter(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Call as
// var checkedBoxes = getCheckedBoxes("mycheckboxes");

// Init on DOM ready.
document.addEventListener('DOMContentLoaded', main);
