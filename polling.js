console.log('opening stuff')

chrome.runtime.onInstalled.addListener(() => {
  console.log('onInstalled...')
  // create alarm after extension is installed / upgraded
  chrome.alarms.create('refresh', { periodInMinutes: 3 })
})

chrome.alarms.onAlarm.addListener(alarm => {
  console.log(alarm.name) // refresh
  helloWorld()
})


function helloWorld () {
  console.log('Hello, world!')

  chrome.storage.local.get('tabs', function (result) {
    const tabList = Object.values(result.tabs)
    console.log('loaded tabs', result, tabList.length)
    if (tabList.length) {
      const tab = tabList[0]
      console.log('checking timeout for ', tab, new Date().getTime())
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
