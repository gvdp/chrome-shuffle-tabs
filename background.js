chrome.action.onClicked.addListener(() => {
  shuffle()
});

async function shuffle() {
  let queryOptions = { pinned: false, currentWindow: true };
  const tabs = await chrome.tabs.query(queryOptions); 
  for(const tab of tabs) {
    const targetIndex = Math.round(Math.random() * tabs.length)
    console.log('moving ', tab.title, ' to ', targetIndex);
    await chrome.tabs.move(tab.id, {index: targetIndex})
    console.log('moved');
  }
}