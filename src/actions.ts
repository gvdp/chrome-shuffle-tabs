export async function shuffle() {
  const queryOptions = { pinned: false, currentWindow: true }
  const tabs = await chrome.tabs.query(queryOptions)
  const notGroupedTabs = tabs.filter((tab) => tab.groupId === -1)
  for (const tab of notGroupedTabs) {
    const targetIndex = Math.floor(Math.random() * notGroupedTabs.length)
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

export async function moveTab() {
  const windows = await chrome.windows.getAll({ populate: true })
  const queryOptions = { pinned: false, active: true, currentWindow: true }
  const tabs = await chrome.tabs.query(queryOptions)
  console.log('tabs', tabs)
  const thisTab = tabs[0]

  console.log('windows', windows, thisTab)
  const otherWindows = windows.filter((window) => window.id !== thisTab.windowId)
  if (otherWindows.length > 1) {
    throw new Error('dunno where to go')
  }

  const targetWindow = otherWindows[0]
  // let queryOptions = { pinned: false, acktive: true, currentWindow: true }
  // const tabs = await chrome.tabs.query(queryOptions)
  // const thisTab = tabs[0]

  console.log('moving tabs', tabs, ' to ', targetWindow)
  await chrome.tabs.move(
    tabs.map((tab) => tab.id),
    { index: -1, windowId: targetWindow.id },
  )
}

export async function wakeUpATab(maxTabs = 15, forceAll = false): Promise<boolean> {
  const queryOptions = { pinned: false }

  console.log('waking up a tab', maxTabs)
  return chrome.tabs.query(queryOptions).then((existingOpenTabs) => {
    const notGroupedOpenTabs = existingOpenTabs.filter((tab) => tab.groupId === -1)
    console.log(
      'open tabs',
      existingOpenTabs.length,
      maxTabs,
      existingOpenTabs,
      'notGroupedOpenTabs',
      notGroupedOpenTabs,
    )
    if (notGroupedOpenTabs.length > maxTabs) {
      console.log('dont wake up any more tabs')
      return false
    } else {
      return new Promise((resolve) => {
        chrome.storage.local.get('tabs', function (result) {
          console.log('result of chrome.storage.local.get', result)
          const tabList = Object.values(result.tabs)
          console.log('tablist', tabList)
          const differentHostNamedTabs = [...tabList]
            .filter(({ url }) => {
              try {
                new URL(url)
                return true
              } catch (e) {
                console.error('Invalid URL', url, e)
                return false
              }
            })
            .filter(
              ({ url }) =>
                !notGroupedOpenTabs.some(
                  (openTab) =>
                    (openTab.url && new URL(openTab.url).hostname) === new URL(url).hostname ||
                    (openTab.pendingUrl && new URL(openTab.pendingUrl).hostname) === new URL(url).hostname,
                ),
            )

          const tabsToWakeUp = forceAll
            ? differentHostNamedTabs.sort((a, b) => b.wakeUpAt - a.wakeUpAt)
            : differentHostNamedTabs.filter(({ wakeUpAt }) => wakeUpAt <= new Date().getTime())

          console.log(
            'tasbs to wake up',
            tabsToWakeUp,
            tabsToWakeUp.map((tab) => `${tab.wakeUpAt} | ${new Date().getTime()}`),
            differentHostNamedTabs,
            new Date().getTime(),
            notGroupedOpenTabs.length,
            differentHostNamedTabs,
            differentHostNamedTabs.filter(({ wakeUpAt }) => wakeUpAt <= new Date().getTime()),
            differentHostNamedTabs.some(({ wakeUpAt }) => wakeUpAt <= new Date().getTime()),
          )
          const firstHalfRandomTabList = tabsToWakeUp
            .sort((a, b) => a.wakeUpAt - b.wakeUpAt)
            .slice(0, Math.max(1, Math.round(tabsToWakeUp.length / 2)))
            .sort(() => (Math.random() > Math.random() ? 1 : -1))

          console.log('loaded tabs', result, firstHalfRandomTabList, tabList.length)

          if (tabList.length) {
            const tabToOpen = firstHalfRandomTabList[0]
            console.log('opening new tab ', tabToOpen.url)
            chrome.windows.getAll((windows) => {
              const windowId = windows[0].id
              chrome.tabs.create({ url: tabToOpen.url, active: false, windowId }).then(() => {
                chrome.storage.local.get('tabs', function () {
                  const newTabList = tabList.filter(({ url }) => url !== tabToOpen.url)
                  chrome.storage.local.set({ tabs: newTabList }, function () {
                    console.log('tab storage updated to ', newTabList)

                    chrome.action.setBadgeText({
                      text: newTabList.length.toString(),
                    })
                    resolve(true)
                  })
                })
              })
            })
          }
        })
      })
    }
  })
}

export async function snoozeATAb() {
  console.log('snoozing a single tab in the background')
  const queryOptions = { pinned: false, active: true, currentWindow: true }
  const currentlyActiveTabs = await chrome.tabs.query(queryOptions)

  chrome.storage.local.get(
    ['tabs', 'snoozedTabHistory'],
    function (result: {
      tabs?: SnoozedTab[]
      snoozedTabHistory?: Record<string, { count: number; lastSnoozeDate: number }>
    }) {
      const currentlySnoozed = result.tabs || []
      const snoozedTabHistory = result.snoozedTabHistory || {}

      const MINUTE = 60 * 1000
      const TEN_MINUTES = 10 * MINUTE
      const TEN_DAYS = 10 * 24 * 60 * 60 * 1000
      const now = new Date().getTime()

      const snoozingUrls = currentlyActiveTabs.map(({ url }) => {
        // Get the number of times this tab has been snoozed before
        const snoozeCount = snoozedTabHistory[url]?.count || 0

        let wakeUpAt
        if (snoozeCount === 0) {
          // First snooze: 10 minutes from now
          wakeUpAt = new Date().getTime() + TEN_MINUTES
        } else {
          // Exponentially increase: 10 * 2^(snoozeCount)
          wakeUpAt = new Date().getTime() + TEN_MINUTES * Math.pow(2, snoozeCount)
        }

        console.log(`Snoozing ${url} - snooze count: ${snoozeCount}, wake up at: ${wakeUpAt}`)

        return {
          url,
          wakeUpAt,
        }
      })
      console.log('snoozing ', currentlyActiveTabs, snoozingUrls)

      // Update the snooze history for each tab
      const updatedHistory = { ...snoozedTabHistory }
      currentlyActiveTabs.forEach(({ url }) => {
        const existing = updatedHistory[url]
        updatedHistory[url] = {
          count: (existing?.count || 0) + 1,
          lastSnoozeDate: now,
        }
      })

      // Clean up snooze history entries older than 30 days
      const cleanedHistory = Object.entries(updatedHistory).reduce(
        (acc, [url, data]) => {
          if (now - data.lastSnoozeDate < TEN_DAYS) {
            acc[url] = data
          }
          return acc
        },
        {} as Record<string, { count: number; lastSnoozeDate: number }>,
      )

      console.log('adding tab to ', currentlySnoozed)
      chrome.storage.local
        .set({ tabs: [...currentlySnoozed, ...snoozingUrls], snoozedTabHistory: cleanedHistory })
        .then((cb) => {
          console.log('Value is set to ', cb)
        })
        .catch((e) => console.error(e))

      chrome.tabs.remove(currentlyActiveTabs.map(({ id }) => id))
    },
  )
}

export async function snooze() {
  console.log('snoozing all tabs as action')
  const tabQueryOptions = { pinned: false, currentWindow: true }
  // todo: the active can maybe also e given as queryOption
  const tabs = (await chrome.tabs.query(tabQueryOptions)).filter(({ active }) => !active)
  const FOUR_HOURS = 4 * 60 * 60 * 1000
  const MINUTE = 60 * 1000
  const wakeUpAt = new Date().getTime() + Math.min(Math.round(Math.random() * tabs.length * MINUTE), FOUR_HOURS)
  console.log('new wakeUpTime', wakeUpAt)

  const urls: SnoozedTab[] = tabs.map(({ url }) => ({
    url,
    wakeUpAt: new Date().getTime() + Math.min(Math.round(Math.random() * tabs.length * MINUTE), FOUR_HOURS),
  }))

  console.log('snoozing ', tabs, urls)
  chrome.storage.local.get('tabs', function (alreadySnoozed: { tabs: SnoozedTab[] }) {
    console.log('alreadySnoozed ', alreadySnoozed)
    chrome.storage.local.set(
      {
        tabs: [...(alreadySnoozed?.tabs?.length ? alreadySnoozed.tabs : []), ...urls],
      },
      function () {
        console.log('Value is set to ')
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
  chrome.storage.local.get('maxTabs', async function ({ maxTabs }) {
    let stillNeedsWakingUp = true
    for (let i = 0; i < number && stillNeedsWakingUp; i++) {
      stillNeedsWakingUp = await wakeUpATab(Number(maxTabs), true)
      if (!stillNeedsWakingUp) {
        console.log('no more tabs to wake up')
        chrome.storage.local.set({ wakeUpEnabled: false }, function () {
          console.log('disabled wake up as no more tabs to wake up')
        })
      }
    }
  })
}

export async function wakeForSameUrl() {
  const queryOptions = { pinned: false, active: true, currentWindow: true }
  const currentTabs = await chrome.tabs.query(queryOptions)

  if (!currentTabs.length || !currentTabs[0].url) {
    console.warn('No active tab with URL found')
    return
  }

  const currentUrl = new URL(currentTabs[0].url)
  const currentHostname = currentUrl.hostname.replace(/^www\./, '')

  chrome.storage.local.get('tabs', async function (result) {
    const tabList = (result.tabs || []) as SnoozedTab[]

    // Filter tabs with the same root domain
    const sameDomainTabs = tabList.filter(({ url }) => {
      try {
        const snoozedHostname = new URL(url).hostname.replace(/^www\./, '')
        return snoozedHostname === currentHostname
      } catch (e) {
        console.error('Invalid URL', url, e)
        return false
      }
    })

    // Open all tabs with the same domain
    for (const tab of sameDomainTabs) {
      console.log('opening tab with same domain', tab.url)
      chrome.tabs.create({ url: tab.url, active: false })
    }

    // Remove the opened tabs from storage
    const remainingTabs = tabList.filter(({ url }) => {
      try {
        const snoozedHostname = new URL(url).hostname.replace(/^www\./, '')
        return snoozedHostname !== currentHostname
      } catch {
        return true
      }
    })

    chrome.storage.local.set({ tabs: remainingTabs }, function () {
      console.log('woke up tabs with same domain, remaining tabs:', remainingTabs.length)
      chrome.action.setBadgeText({ text: remainingTabs.length.toString() })
    })
  })
}
