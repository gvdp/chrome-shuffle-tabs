import browser from 'webextension-polyfill'
import { shuffle, snoozeATAb, wakeUpATab, setBadgeCount } from './src/actions'
import { get } from './src/storage'
import { REFRESH_PERIOD, TABS_TO_WAKE_PER_PERIOD } from './src/constants'

export { REFRESH_PERIOD, TABS_TO_WAKE_PER_PERIOD }

browser.runtime.onInstalled.addListener(async () => {
  console.log('install callback')
  const maxTabs = await get('maxTabs')
  await wakeUpATab(Number(maxTabs))
})

chrome.alarms.create('refresh', { periodInMinutes: REFRESH_PERIOD })

chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('alarm triggered', alarm.name) // refresh

  const wakeUpEnabled = await get('wakeUpEnabled')
  const maxTabs = await get('maxTabs')

  if (wakeUpEnabled) {
    for (let i = 0; i < TABS_TO_WAKE_PER_PERIOD; i++) {
      await wakeUpATab(Number(maxTabs))
    }
  }
  setBadgeCount()
})

// Keyboard commands (defined in manifest.json, rebindable at chrome://extensions/shortcuts):
// - shuffleTabs: shuffle() - Alt+S, mac Cmd+Ctrl+A
// - snoozeTab:   snoozeATAb() snoozes the active tab - Alt+Z, mac Cmd+Ctrl+Z
// - altSnooze:   snoozeATAb() as well - mac only, Cmd+Ctrl+S
chrome.commands.onCommand.addListener(function (command) {
  // Check if the command matches the key combination you want
  console.log('command', command)
  if (command === 'shuffleTabs') {
    console.log('Shuffle detected!')
    shuffle()
  }

  if (command === 'snoozeTab' || command === 'altSnooze') {
    console.log('Snooze detected!')
    snoozeATAb()
  }
})

setBadgeCount()

chrome.storage.local.get('wakeUpEnabled', async function ({ wakeUpEnabled }) {
  console.log('wakeUpEnabled', wakeUpEnabled)

  chrome.action.setBadgeBackgroundColor({
    color: wakeUpEnabled ? 'green' : 'lightsteelblue',
  })
})
