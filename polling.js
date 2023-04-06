console.log('opening stuff')

chrome.runtime.onInstalled.addListener(() => {
  console.log('onInstalled...')
  // create alarm after extension is installed / upgraded
  chrome.alarms.create('refresh', { periodInMinutes: 3 })
})

chrome.alarms.onAlarm.addListener(alarm => {
  console.log(alarm.name) // refresh
  wakeUpATab()
})


function wakeUpATab () {
  chrome.storage.local.get('tabs', function (result) {
    const tabList = Object.values(result.tabs)
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