import browser from 'webextension-polyfill'
import { shuffle, snoozeATAb, wakeUpATab } from './src/actions'
import { get } from './src/storage'

// todo: make this variable
const REFRESH_PERIOD = 1

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
    await wakeUpATab(Number(maxTabs))
    await wakeUpATab(Number(maxTabs))
    // if (!wokeUp) {
    //   await set({ wakeUpEnabled: false })
    // }
  }
})

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
