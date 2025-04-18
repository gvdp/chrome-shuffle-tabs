// todo: make this variable
const MAX_TABS = 10

export async function shuffle() {
  const queryOptions = { pinned: false, currentWindow: true }
  const tabs = await chrome.tabs.query(queryOptions)
  for (const tab of tabs) {
    const targetIndex = Math.floor(Math.random() * tabs.length)
    await chrome.tabs.move(tab.id, { index: targetIndex })
  }
}

export async function merge() {
  const windows = await chrome.windows.getAll({ populate: true })

  const firstWindow = windows[0]
  const otherTabs = windows
    .filter((window) => window !== firstWindow)
    .reduce((allTabs, window) => {
      return [...allTabs, ...window.tabs]
    }, [])

  const otherTabIds = otherTabs.map((tab) => tab.id)
  await chrome.tabs.move(otherTabIds, { index: -1, windowId: firstWindow.id })
}

// todo: this should probably be async
export function wakeUpATab() {
  let queryOptions = { pinned: false }

  chrome.tabs.query(queryOptions).then((tabs) => {
    console.log('open tabs', tabs.length, tabs)
    if (tabs.length > MAX_TABS) {
      const wakeUpEnabled = false
      chrome.storage.local.set({ wakeUpEnabled }, function () {
        console.log('waking up disabled')
      })
      chrome.action.setBadgeBackgroundColor({
        color: wakeUpEnabled ? 'green' : 'lightsteelblue',
      })
      console.log('dont wake up any more tabs')
      return
    } else {
      chrome.storage.local.get('tabs', function (result) {
        const tabList = Object.values(result.tabs)
        tabList.sort(() => (Math.random() > Math.random() ? 1 : -1))
        console.log('loaded tabs', result, tabList.length)

        if (tabList.length) {
          const tab = tabList[0]
          // console.log("checking timeout for ", tab);
          // console.log("currentTime", new Date());
          // console.log("wake up time", new Date(tab.wakeUpAt));
          // if (tab.wakeUpAt < new Date().getTime()) {
          // }
          console.log('opening new tab ', tab.url)
          chrome.windows.getAll((windows) => {
            const windowId = windows[0].id
            chrome.tabs.create({ url: tab.url, active: false, windowId }).then(() => {
              chrome.storage.local.get('tabs', function () {
                const newTabList = tabList.filter(({ url }) => url !== tab.url)
                chrome.storage.local.set({ tabs: newTabList }, function () {
                  console.log('tab storage updated to ', newTabList)
                  chrome.action.setBadgeText({
                    text: newTabList.length.toString(),
                  })
                })
              })
            })
          })
        }
      })
    }
  })
}

export async function snoozeATAb() {
  console.log('snoozing a single tab in the background')
  let queryOptions = { pinned: false, active: true, currentWindow: true }
  const tabs = await chrome.tabs.query(queryOptions)

  // todo: same as in snoozeALl method in actions.js , can be extracted
  chrome.storage.local.get('tabs', function (alreadySnoozed) {
    const FOUR_HOURS = 4 * 60 * 60 * 1000
    const MINUTE = 60 * 1000
    const wakeUpAt =
      new Date().getTime() + Math.min(Math.round(Math.random() * alreadySnoozed.tabs.length * MINUTE), FOUR_HOURS)

    console.log('new wakeUpTime', wakeUpAt)

    const urls = tabs.map(({ url }) => ({
      url,
      wakeUpAt,
    }))
    console.log('snoozing ', tabs, urls)

    console.log('adding tab to ', alreadySnoozed)
    chrome.storage.local
      .set({ tabs: [...alreadySnoozed.tabs, ...urls] })
      .then((cb) => {
        console.log('Value is set to ', cb)
      })
      .catch((e) => console.error(e))

    chrome.tabs.remove(tabs.map(({ id }) => id))
  })
}

export async function snooze() {
  console.log('snoozing all tabs as action')
  let queryOptions = { pinned: false, currentWindow: true }
  // todo: the active can maybe also e given as queryOption
  const tabs = (await chrome.tabs.query(queryOptions)).filter(({ active }) => !active)
  const FOUR_HOURS = 4 * 60 * 60 * 1000
  const MINUTE = 60 * 1000
  const wakeUpAt = new Date().getTime() + Math.min(Math.round(Math.random() * tabs.length * MINUTE), FOUR_HOURS)
  console.log('new wakeUpTime', wakeUpAt)

  const urls = tabs.map(({ url }) => ({
    url,
    wakeUpAt: new Date().getTime() + Math.min(Math.round(Math.random() * tabs.length * MINUTE), FOUR_HOURS),
  }))

  console.log('snoozing ', tabs, urls)
  chrome.storage.local.get('tabs', function (alreadySnoozed) {
    console.log('alreadySnoozed ', alreadySnoozed)
    chrome.storage.local.set(
      {
        tabs: [...(alreadySnoozed?.tabs?.length ? alreadySnoozed.tabs : []), ...urls],
      },
      function (cb) {
        console.log('Value is set to ', cb)
      },
    )
    chrome.tabs.remove(tabs.map(({ id }) => id))
  })
}

export async function unsnooze() {
  chrome.storage.local.get('tabs', async function (result) {
    const tabList = Object.values(result.tabs)
    console.log('unsnoozing tabs', result, tabList.length)
    for (const tab of tabList) {
      console.log('opening new tab ', tab.url)
      chrome.tabs.create({ url: tab.url, active: false })
    }

    chrome.storage.local.set({ tabs: [] }, function () {
      console.log('tab storage emptied')
    })
  })
}

export async function unsnoozeSome(number = 5) {
  chrome.storage.local.get('tabs', async function (result) {
    const tabList = result.tabs
    const firstPart = tabList.slice(0, tabList.length)
    firstPart.sort(() => (Math.random() > Math.random() ? 1 : -1))

    const toUnsnooze = number > 0 ? firstPart.slice(0, number) : firstPart
    console.log('unsnoozing tabs')
    for (const tab of toUnsnooze) {
      console.log('opening new tab ', tab.url)
      chrome.tabs.create({ url: tab.url, active: false })
    }
    const remaining = tabList.filter(({ url }) => !toUnsnooze.map(({ url }) => url).includes(url))
    console.log('remaining', remaining)

    chrome.storage.local.set({ tabs: remaining }, function () {
      console.log('tab storage updated with remaining tabs')
    })
  })
}
