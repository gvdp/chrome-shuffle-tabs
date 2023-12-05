import browser from "webextension-polyfill";
import { shuffle, snoozeATAb, wakeUpATab } from "./src/actions";

browser.runtime.onInstalled.addListener(() => {
  console.log("Installedd!");
});

// todo: make this variable
const REFRESH_PERIOD = 4;

console.log("opening background.js to add alarms");

chrome.alarms.create("refresh", { periodInMinutes: REFRESH_PERIOD });

chrome.commands.onCommand.addListener(function (command) {
  // Check if the command matches the key combination you want
  console.log("command", command);
  // todo: rename command
  if (command === "myKeyCombination") {
    console.log("Key combination detected!");
    shuffle();
  }

  // todo: these actions and/or key combinations should be documented
  if (command === "snoozeCombination") {
    console.log("Snooze detected!");
    snoozeATAb();
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("alarm triggered", alarm.name); // refresh
  chrome.storage.local.get("wakeUpEnabled", function ({ wakeUpEnabled }) {
    console.log("wakeUpEnabled", wakeUpEnabled);
    if (wakeUpEnabled) {
      wakeUpATab();
    }
  });
});
