// todo: make these variable
const REFRESH_PERIOD = 4;
const MAX_TABS = 10;

console.log("opening background.js to add alarms");

// wakeUpATab();

// chrome.runtime.onInstalled.addListener(() => {
// console.log('onInstalled, adding alarm and key command event listeners')
// create alarm after extension is installed / upgraded
chrome.alarms.create("refresh", { periodInMinutes: REFRESH_PERIOD });

// document.addEventListener('keydown', function(event) {
//   console.log('event in polling.js', event);
//   // Check if the key combination you want is pressed
//   if (event.key === 'Control' && event.code === 'KeyK') {
//     // Perform your desired action here
//     console.log('Key combination detected!');
//     // Call your function or execute your code here
//     // ...
//   }
// });

chrome.commands.onCommand.addListener(function (command) {
  // Check if the command matches the key combination you want
  console.log("command", command);
  // todo: rename command
  if (command === "myKeyCombination") {
    // Perform your desired action here
    console.log("Key combination detected!");
    // Call your function or execute your code here
    // ...
    shuffle();
  }

  // todo: these actions and/or key combinations should be documented
  if (command === "snoozeCombination") {
    // Perform your desired action here
    console.log("Snooze detected!");
    // Call your function or execute your code here
    // ...
    snoozeATAb();
  }
});
// })

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("alarm triggered", alarm.name); // refresh
  chrome.storage.local.get("wakeUpEnabled", function ({ wakeUpEnabled }) {
    console.log("wakeUpEnabled", wakeUpEnabled);
    if (wakeUpEnabled) {
      wakeUpATab();
    }
  });
});

// todo: this is copy pasted, should be shared

async function shuffle() {
  console.log("shufflin");
  let queryOptions = { pinned: false, currentWindow: true };
  const tabs = await chrome.tabs.query(queryOptions);
  for (const tab of tabs) {
    const targetIndex = Math.round(Math.random() * tabs.length);
    await chrome.tabs.move(tab.id, { index: targetIndex });
  }
}

function wakeUpATab() {
  let queryOptions = { pinned: false };

  chrome.tabs.query(queryOptions).then((tabs) => {
    console.log("open tabs", tabs.length, tabs);
    if (tabs.length > MAX_TABS) {
      console.log("dont wake up any more tabs");
      return;
    } else {
      chrome.storage.local.get("tabs", function (result) {
        const tabList = Object.values(result.tabs);
        tabList.sort((a, b) => (a.wakeUpAt > b.wakeUpAt ? 1 : -1));
        console.log(
          "loaded tabs",
          result,
          tabList.length,
          tabList.map(({ wakeUpAt }) => new Date(wakeUpAt))
        );
        if (tabList.length) {
          const tab = tabList[0];
          console.log("checking timeout for ", tab);
          console.log("currentTime", new Date());
          console.log("wake up time", new Date(tab.wakeUpAt));
          if (tab.wakeUpAt < new Date().getTime()) {
            console.log("opening new tab ", tab.url);
            chrome.tabs.create({ url: tab.url, active: false });
            chrome.storage.local.get("tabs", function (result) {
              const newTabList = tabList.filter(({ url }) => url !== tab.url);
              chrome.storage.local.set({ tabs: newTabList }, function (cb) {
                console.log("tab storage updated to ", newTabList);
              });
            });
          }
        }
      });
    }
  });
}

async function snoozeATAb() {
  console.log("snoozing a single tab in the background");
  let queryOptions = { pinned: false, active: true, currentWindow: true };
  const tabs = await chrome.tabs.query(queryOptions);

  // todo: same as in snoozeALl method in actions.js , can be extracted
  chrome.storage.local.get("tabs", function (alreadySnoozed) {
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    const MINUTE = 60 * 1000;
    const wakeUpAt =
      new Date().getTime() +
      Math.min(
        Math.round(Math.random() * alreadySnoozed.tabs.length * MINUTE),
        FOUR_HOURS
      );

    console.log("new wakeUpTime", wakeUpAt);

    const urls = tabs.map(({ url }) => ({
      url,
      wakeUpAt,
    }));
    console.log("snoozing ", tabs, urls);

    console.log("adding tab to ", alreadySnoozed);
    chrome.storage.local
      .set({ tabs: [...urls, ...alreadySnoozed.tabs] })
      .then((cb) => {
        console.log("Value is set to ", cb);
      })
      .catch((e) => console.error(e));

    chrome.tabs.remove(tabs.map(({ id }) => id));
  });
}
