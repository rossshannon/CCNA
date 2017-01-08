
const regex = /ending in\s*(\d{4})/;


// MutationSelectorObserver represents a selector and it's associated initialization callback.
const MutationSelectorObserver = function (selector, callback) {
    this.selector = selector;
    this.callback = callback;
};

// List of MutationSelectorObservers.
let msobservers = [];
msobservers.initialize = function (selector, callback) {

    // Wrap the callback so that we can ensure that it is only
    // called once per element.
    let seen = [];
    callbackOnce = function () {
        if (seen.indexOf(this) == -1) {
            seen.push(this);
            $(this).each(callback);
        }
    };

    // See if the selector matches any elements already on the page.
    $(selector).each(callbackOnce);

    //PS: for my purposes I can avoid adding it again if it's the same selector, no matter the callback.
    for (let i = 0; i < msobservers.length; i++) {
        if (msobservers[i].selector === selector) {
            return;
        }
    }

    // Then, add it to the list of selector observers.
    this.push(new MutationSelectorObserver(selector, callbackOnce));
};

// The MutationObserver watches for when new elements are added to the DOM.
const observer = new MutationObserver(function (mutations) {

    // For each MutationSelectorObserver currently registered.
    for (let j = 0; j < msobservers.length; j++) {
        $(msobservers[j].selector).each(msobservers[j].callback);
    }
});

// Observe the entire document.
observer.observe(document.documentElement, {childList: true, subtree: true, attributes: true});



function updateNicknames() {
    chrome.storage.sync.get("nicknames", (data) => {
        const nicknames = data["nicknames"] == undefined ? {} : data["nicknames"];
        const appendNickname = function() {
            $(this).find(".cc_nickname").remove();
            const ccnum = CryptoJS.SHA256($(this).text().match(regex)[1]);
            if(nicknames[ccnum] != undefined) {
                const node = $("<span class='cc_nickname'></span>").text(" - "+nicknames[ccnum]);
                $(this).append(node);
            }
        };

        msobservers.initialize(".pmts-instrument-number-tail", appendNickname);
        msobservers.initialize(".card-info span.a-color-secondary", appendNickname);
        msobservers.initialize("#payment-information span.a-color-secondary", appendNickname);
    });
}

function getCardNumbers(type) {
    let cardNumbers = [];
    let selector = null;
    if (type == 1) {
        selector = $(".pmts-instrument-number-tail");
    } else if (type == 2) {
        selector = $(".card-info span.a-color-secondary");
    }
   selector.each(function(){
        cardNumbers.push($(this).text().match(regex)[1]);
    });

    chrome.runtime.sendMessage({
        action: "getCards",
        numbers: cardNumbers
    });
}

updateNicknames();
