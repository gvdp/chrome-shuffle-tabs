export const get = async (key: string): Promise<string> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, async function (result) {
      resolve(result[key] as string)
    })
  })
}
