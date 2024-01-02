import { shuffle, merge, snooze, unsnooze, unsnoozeSome } from "./src/actions";

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
  document.getElementById("unsnoozeSome").addEventListener("click", () => {
    unsnoozeSome();
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
