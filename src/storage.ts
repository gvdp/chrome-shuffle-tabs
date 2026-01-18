export const get = async (key: string): Promise<string> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, async function (result) {
      resolve(result[key] as string)
    })
  })
}

export const set = async (keyValue: object): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set(keyValue, function () {
      console.log('set', keyValue)
      resolve()
    })
  })
}
