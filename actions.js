
console.log('adding event listeners in acionts.js');

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('shuffle').addEventListener('click', () => {
    shuffle()
  })
  document.getElementById('merge').addEventListener('click', () => {
    merge()
  })
  document.getElementById('snooze').addEventListener('click', () => {
    snooze()
  })
  document.getElementById('unsnooze').addEventListener('click', () => {
    unsnooze()
  })
  chrome.storage.local.get('tabs', async function (result) {
    if (result) {
      const tabList = Object.values(result?.tabs || {})
      document.getElementById(
        'tabcount'
      ).textContent = `Snoozed tabs: ${tabList?.length || '0'}`
    }
  })
  console.log('added event listeners')

  chrome.alarms.getAll(alarms => {
    console.log('current alarms ', alarms, alarms.map(({scheduledTime}) => new Date(scheduledTime)))
  })

  // wakeUpATab()
})



async function shuffle () {
  console.log('shufflin')
  let queryOptions = { pinned: false, currentWindow: true }
  const tabs = await chrome.tabs.query(queryOptions)
  for (const tab of tabs) {
    const targetIndex = Math.round(Math.random() * tabs.length)
    await chrome.tabs.move(tab.id, { index: targetIndex })
  }
}

async function snooze () {
  let queryOptions = { pinned: false, currentWindow: true }
  const tabs = (await chrome.tabs.query(queryOptions)).filter(
    ({ active }) => !active
  )
  const urls = tabs.map(({ url }, index) => ({
    url,
    wakeUpAt:
      new Date().getTime() +
      Math.random() * (index + 1) * (index + 1) * tabs.length * 1000
  }))
  console.log('snoozing ', tabs, urls)
  chrome.storage.local.get('tabs', function (alreadySnoozed) {
    chrome.storage.local.set(
      { tabs: { ...urls, ...alreadySnoozed.tabs } },
      function (cb) {
        console.log('Value is set to ', cb)
      }
    )
    chrome.tabs.remove(tabs.map(({ id }) => id))
  })
}

async function unsnooze () {
  chrome.storage.local.get('tabs', async function (result) {
    const tabList = Object.values(result.tabs)
    console.log('loaded tabs', result, tabList.length)
    for (const tab of tabList) {
      console.log('opening new tab ', tab.url)
      chrome.tabs.create({ url: tab.url, active: false })
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
      console.log('tab storage updated to ', newTabList)
    })
  })
}

async function merge () {
  const windows = await chrome.windows.getAll({ populate: true })

  const firstWindow = windows[0]
  const otherTabs = windows
    .filter(window => window !== firstWindow)
    .reduce((allTabs, window) => {
      return [...allTabs, ...window.tabs]
    }, [])

  const otherTabIds = otherTabs.map(tab => tab.id)
  await chrome.tabs.move(otherTabIds, { index: -1, windowId: firstWindow.id })
}

function wakeUpATab () {
  console.log('waking up tabs');
  chrome.storage.local.get('tabs', function (result) {
    const tabList = Object.values(result.tabs)
        tabList.sort((a,b) => a.wakeUpAt > b.wakeUpAt ? 1 : -1)

    console.log('loaded tabs', result, tabList.length, tabList.map(({wakeUpAt}) => new Date(wakeUpAt)))
    if (tabList.length) {
      const tab = tabList[0]
      console.log('checking timeout for ', tab)
      console.log('currentTime', new Date());
      console.log('wake up time', new Date(tab.wakeUpAt));
      if (tab.wakeUpAt < new Date().getTime()) {
        console.log('opening new tab ', tab.url)
        chrome.tabs.create({ url: tab.url, active: false })
        chrome.storage.local.get('tabs', function (result) {
          const newTabList = tabList.filter(({ url }) => url !== tab.url)
          chrome.storage.local.set({ tabs: newTabList }, function (cb) {
            console.log('tab storage updated to ', newTabList)
          })
        })
      }
    }
  })
}
