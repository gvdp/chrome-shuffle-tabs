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

  console.log('init open snooze stuff')
  
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
  const tabs = (await chrome.tabs.query(queryOptions)).filter(({active}) => !active)
  const urls = tabs.map(({ url }, index) => ({
    url,
    wakeUpAt: new Date().getTime() + (Math.random() * (index + 1)* (index + 1) * tabs.length * 1000)
  }))
  console.log('snoozing ', tabs, urls)
  chrome.storage.local.set({ tabs: urls }, function (cb) {
    console.log('Value is set to ', cb)
  })
    chrome.tabs.remove(tabs.map(({id}) => id))
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
