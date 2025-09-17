import browser from 'webextension-polyfill'
import { shuffle, snoozeATAb, wakeUpATab } from './src/actions'

browser.runtime.onInstalled.addListener(() => {
  console.log('Installedd!')
  chrome.storage.local.get('maxTabs', async function ({ maxTabs }) {
    await wakeUpATab(maxTabs)
    await wakeUpATab(maxTabs)
  })
})

// todo: make this variable
const REFRESH_PERIOD = 1
console.log('opening background.js to add alarms')

chrome.alarms.create('refresh', { periodInMinutes: REFRESH_PERIOD })

chrome.commands.onCommand.addListener(function (command) {
  // Check if the command matches the key combination you want
  console.log('command', command)
  // todo: rename command
  if (command === 'myKeyCombination') {
    console.log('Key combination detected!')
    shuffle()
  }

  // todo: these actions and/or key combinations should be documented
  if (command === 'snoozeCombination') {
    console.log('Snooze detected!')
    snoozeATAb()
  }
})

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('alarm triggered', alarm.name) // refresh
  chrome.storage.local.get('wakeUpEnabled', async function ({ wakeUpEnabled }) {
    console.log('wakeUpEnabled', wakeUpEnabled)
    chrome.storage.local.get('maxTabs', async function ({ maxTabs }) {
      if (wakeUpEnabled) {
        await wakeUpATab(maxTabs)
        await wakeUpATab(maxTabs)
      }
    })
  })
})

chrome.storage.local.get('tabs', async function (result) {
  console.log('got tabs', result)
  if (result) {
    const tabList = Object.values(result?.tabs || {})
    const count = tabList?.length || 0
    // document.getElementById("tabcount").textContent = `Snoozed tabs: ${count}`;
    chrome.action.setBadgeText({ text: count.toString() })
  }
})

chrome.storage.local.get('wakeUpEnabled', async function ({ wakeUpEnabled }) {
  console.log('wakeUpEnabled', wakeUpEnabled)

  chrome.action.setBadgeBackgroundColor({
    color: wakeUpEnabled ? 'green' : 'lightsteelblue',
  })
})
