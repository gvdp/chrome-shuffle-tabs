import { shuffle, merge, snooze, unsnooze, unsnoozeSome, moveTab } from './src/actions'

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

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('shuffle')?.addEventListener('click', () => {
    shuffle()
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
  document.getElementById('maxTabs')?.addEventListener('change', (event) => {
    console.log('change snoozing tabs', (event.target as HTMLInputElement).value)
    chrome.storage.local.set({ maxTabs: Number((event.target as HTMLInputElement).value) }, function () {
      console.log('maxTabs set ')
    })
  })

  chrome.storage.local.get('tabs', async function (result) {
    console.log('got tabs', result)
    if (result) {
      const tabList = Object.values(result?.tabs || {})
      const count = tabList?.length || 0
      setText('tabcount', `Snoozed tabs: ${count}`)
      chrome.action.setBadgeText({ text: count.toString() })
    }
  })

  chrome.storage.local.get('wakeUpEnabled', async function ({ wakeUpEnabled }) {
    console.log('wakeUpEnabled', wakeUpEnabled)

    chrome.action.setBadgeBackgroundColor({
      color: wakeUpEnabled ? 'green' : 'lightsteelblue',
    })

    setText('wakeUpEnabled', `Wakeup ${wakeUpEnabled ? 'Enabled' : 'Disabled'}`)

    document.getElementById('wakeUpEnabled')?.addEventListener('click', () => {
      chrome.storage.local.set({ wakeUpEnabled: !wakeUpEnabled }, function () {
        wakeUpEnabled = !wakeUpEnabled
        console.log('waking up enabled / disabled', wakeUpEnabled)
        // todo: also change event listener now
        setText('wakeUpEnabled', `Wakeup ${wakeUpEnabled ? 'Enabled' : 'Disabled'}`)
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
