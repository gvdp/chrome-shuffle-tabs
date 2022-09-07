document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('shuffle').addEventListener('click', () => {
    shuffle()
  })
  document.getElementById('merge').addEventListener('click', () => {
    merge()
  })
})

async function shuffle () {
  let queryOptions = { pinned: false, currentWindow: true }
  const tabs = await chrome.tabs.query(queryOptions)
  for (const tab of tabs) {
    const targetIndex = Math.round(Math.random() * tabs.length)
    await chrome.tabs.move(tab.id, { index: targetIndex })
  }
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
