import {
  shuffle,
  merge,
  snooze,
  unsnooze,
  unsnoozeSome,
  unsnoozeSomeUnrestricted,
  moveTab,
  wakeForSameUrl,
  sortTabsByUrl,
  setBadgeCount,
} from './src/actions'
import { get } from './src/storage'

console.log('adding event listeners in acionts.js')

const setText = (id: string, text: string) => {
  const el = document.getElementById(id)
  if (el) {
    el.textContent = text
  } else {
    throw new Error(`no element with id ${id}`)
  }
}
const setValue = (id: string, text: string) => {
  const el = document.getElementById(id)
  if (el) {
    ;(el as HTMLInputElement).value = text
  } else {
    throw new Error(`no element with id ${id}`)
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('shuffle')?.addEventListener('click', () => {
    shuffle()
  })

  document.getElementById('sortTabsByUrl')?.addEventListener('click', () => {
    console.log('sortTabsByUrl clicked')
    sortTabsByUrl()
  })

  document.getElementById('merge')?.addEventListener('click', () => {
    merge()
  })

  document.getElementById('move')?.addEventListener('click', () => {
    moveTab()
  })

  document.getElementById('snooze')?.addEventListener('click', () => {
    console.log('snooze clicked')
    snooze()
  })

  document.getElementById('unsnooze')?.addEventListener('click', () => {
    unsnooze()
  })

  document.getElementById('unsnoozeSome')?.addEventListener('click', () => {
    unsnoozeSome()
  })

  document.getElementById('unsnoozeSomeUnrestricted')?.addEventListener('click', () => {
    unsnoozeSomeUnrestricted()
  })

  document.getElementById('wakeForSameUrl')?.addEventListener('click', () => {
    console.log('wakeForSameUrl clicked')
    wakeForSameUrl()
  })

  document.getElementById('maxTabs')?.addEventListener('change', (event) => {
    console.log('change snoozing tabs', (event.target as HTMLInputElement).value)
    chrome.storage.local.set({ maxTabs: Number((event.target as HTMLInputElement).value) }, function () {
      console.log('maxTabs set ')
    })
  })

  const tabs = await get<SnoozedTab[]>('tabs')
  console.log('got tabs', tabs)
  const count = tabs.length
  const readyCount = tabs.filter(({ wakeUpAt }) => wakeUpAt <= Date.now()).length
  setText('tabcount', `Snoozed tabs: ${count}\nReady to wake up: ${readyCount}`)

  setBadgeCount()

  chrome.storage.local.get('wakeUpEnabled', async function ({ wakeUpEnabled }: { wakeUpEnabled: boolean }) {
    console.log('wakeUpEnabled', wakeUpEnabled)

    chrome.action.setBadgeBackgroundColor({
      color: wakeUpEnabled ? 'green' : 'lightsteelblue',
    })

    const wakeUpButton = document.getElementById('wakeUpEnabled')
    setText('wakeUpEnabled', `Wakeup ${wakeUpEnabled ? 'Enabled' : 'Disabled'}`)
    wakeUpButton?.classList.toggle('enabled', wakeUpEnabled)
    wakeUpButton?.classList.toggle('disabled', !wakeUpEnabled)

    wakeUpButton?.addEventListener('click', () => {
      chrome.storage.local.set({ wakeUpEnabled: !wakeUpEnabled }, function () {
        wakeUpEnabled = !wakeUpEnabled
        console.log('waking up enabled / disabled', wakeUpEnabled)
        setText('wakeUpEnabled', `Wakeup ${wakeUpEnabled ? 'Enabled' : 'Disabled'}`)
        wakeUpButton?.classList.toggle('enabled', wakeUpEnabled)
        wakeUpButton?.classList.toggle('disabled', !wakeUpEnabled)
        chrome.action.setBadgeBackgroundColor({
          color: wakeUpEnabled ? 'green' : 'lightsteelblue',
        })
      })
    })
  })
  console.log('added event listeners')

  chrome.alarms.getAll((alarms) => {
    console.log(
      'current alarms ',
      alarms,
      alarms.map(({ scheduledTime }) => new Date(scheduledTime)),
    )
  })

  chrome.storage.local.get('maxTabs', async function ({ maxTabs }) {
    console.log('maxTabs value get', maxTabs)
    setValue('maxTabs', maxTabs as string)
  })

  chrome.storage.local.get('tabs', function (currentlySnoozed: { tabs: SnoozedTab[] }) {
    console.log(
      'currentlySnoozed',
      currentlySnoozed.tabs?.map((tab) => ({
        ...tab,
        wakeTime: new Date(tab.wakeUpAt),
      })),
    )
  })
})
