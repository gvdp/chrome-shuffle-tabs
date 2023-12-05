console.log("adding event listeners in acionts.js");

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("shuffle").addEventListener("click", () => {
    shuffle();
  });
  document.getElementById("merge").addEventListener("click", () => {
    merge();
  });
  document.getElementById("snooze").addEventListener("click", () => {
    console.log("snooze clicked");
    snooze();
  });
  document.getElementById("unsnooze").addEventListener("click", () => {
    unsnooze();
  });

  chrome.storage.local.get("tabs", async function (result) {
    if (result) {
      const tabList = Object.values(result?.tabs || {});
      document.getElementById("tabcount").textContent = `Snoozed tabs: ${
        tabList?.length || "0"
      }`;
    }
  });
  chrome.storage.local.get("wakeUpEnabled", async function ({ wakeUpEnabled }) {
    console.log("wakeUpEnabled", wakeUpEnabled);

    document.getElementById("wakeUpEnabled").textContent = `Wakeup ${
      wakeUpEnabled ? "Enabled" : "Disabled"
    }`;

    document.getElementById("wakeUpEnabled").addEventListener("click", () => {
      chrome.storage.local.set(
        { wakeUpEnabled: !wakeUpEnabled },
        function (cb) {
          console.log("waking up enabled / disabled");
          // todo: also change event listener now
          document.getElementById("wakeUpEnabled").textContent = `Wakeup ${
            !wakeUpEnabled ? "Enabled" : "Disabled"
          }`;
        }
      );
    });
  });
  console.log("added event listeners");

  chrome.alarms.getAll((alarms) => {
    console.log(
      "current alarms ",
      alarms,
      alarms.map(({ scheduledTime }) => new Date(scheduledTime))
    );
  });

  chrome.storage.local.get("tabs", function (currentlySnoozed) {
    console.log(
      "currentlySnoozed",
      currentlySnoozed.tabs?.map((tab) => ({
        ...tab,
        wakeTime: new Date(tab.wakeUpAt),
      }))
    );
  });
});

async function shuffle() {
  console.log("shufflin");
  let queryOptions = { pinned: false, currentWindow: true };
  const tabs = await chrome.tabs.query(queryOptions);
  for (const tab of tabs) {
    const targetIndex = Math.round(Math.random() * tabs.length);
    await chrome.tabs.move(tab.id, { index: targetIndex });
  }
}

async function snooze() {
  console.log("snoozing all tabs as action");
  let queryOptions = { pinned: false, currentWindow: true };
  // todo: the active can maybe also e given as queryOption
  const tabs = (await chrome.tabs.query(queryOptions)).filter(
    ({ active }) => !active
  );
  const FOUR_HOURS = 4 * 60 * 60 * 1000;
  const MINUTE = 60 * 1000;
  const wakeUpAt =
    new Date().getTime() +
    Math.min(Math.round(Math.random() * tabs.length * MINUTE), FOUR_HOURS);
  console.log("new wakeUpTime", wakeUpAt);

  const urls = tabs.map(({ url }) => ({
    url,
    wakeUpAt:
      new Date().getTime() +
      Math.min(Math.round(Math.random() * tabs.length * MINUTE), FOUR_HOURS),
  }));

  console.log("snoozing ", tabs, urls);
  chrome.storage.local.get("tabs", function (alreadySnoozed) {
    console.log("alreadySnoozed ", alreadySnoozed);
    chrome.storage.local.set(
      {
        tabs: [
          ...(alreadySnoozed?.tabs?.length ? alreadySnoozed.tabs : []),
          ...urls,
        ],
      },
      function (cb) {
        console.log("Value is set to ", cb);
      }
    );
    chrome.tabs.remove(tabs.map(({ id }) => id));
  });
}

async function unsnooze() {
  chrome.storage.local.get("tabs", async function (result) {
    const tabList = Object.values(result.tabs);
    console.log("unsnoozing tabs", result, tabList.length);
    for (const tab of tabList) {
      console.log("opening new tab ", tab.url);
      chrome.tabs.create({ url: tab.url, active: false });
      // await new Promise((resolve)=> {

      //   chrome.storage.local.get('tabs', function (result) {
      //     const newTabList = tabList.filter(({ url }) => url !== tab.url)
      //     chrome.storage.local.set({ tabs: newTabList }, function (cb) {
      //       console.log('tab storage updated to ', newTabList)
      //       resolve()
      //     })
      //   })
      // })
    }

    chrome.storage.local.set({ tabs: [] }, function (cb) {
      console.log("tab storage emptied");
    });
  });
}

async function merge() {
  const windows = await chrome.windows.getAll({ populate: true });

  const firstWindow = windows[0];
  const otherTabs = windows
    .filter((window) => window !== firstWindow)
    .reduce((allTabs, window) => {
      return [...allTabs, ...window.tabs];
    }, []);

  const otherTabIds = otherTabs.map((tab) => tab.id);
  await chrome.tabs.move(otherTabIds, { index: -1, windowId: firstWindow.id });
}

function wakeUpATab() {
  console.log("waking up tabs");
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
