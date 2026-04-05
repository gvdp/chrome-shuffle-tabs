export const get = async <ReturnValue>(key: string): Promise<ReturnValue> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, async function (result) {
      resolve(result[key] as ReturnValue)
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
