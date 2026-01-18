export const get = async (key) => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, async function (result) {
      resolve(result[key])
    })
  })
}
