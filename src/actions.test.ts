import { expect, test } from 'vitest'
import sinon from 'sinon'
import {
  shuffle,
  merge,
  snooze,
  snoozeForSameUrl,
  showShortcutLabel,
  wakeUpATab,
  countSnoozedTabsByHost,
} from './actions'

test('showShortcutLabel appends the bound shortcut to the button label', async () => {
  document.body.innerHTML = '<button id="shuffle">Shuffle</button>'
  // @ts-expect-error need to find a way to type this global
  global.chrome = {
    commands: {
      getAll: sinon.fake.returns(
        Promise.resolve([
          { name: 'snoozeTab', shortcut: '⌃⌘Z' },
          { name: 'shuffleTabs', shortcut: '⌃⌘A' },
        ]),
      ),
    },
  }

  await showShortcutLabel('shuffle', 'shuffleTabs')

  expect(document.getElementById('shuffle')?.textContent).toBe('Shuffle (⌃⌘A)')
})

test('showShortcutLabel leaves the label alone when no shortcut is bound', async () => {
  document.body.innerHTML = '<button id="shuffle">Shuffle</button>'
  // @ts-expect-error need to find a way to type this global
  global.chrome = {
    commands: {
      getAll: sinon.fake.returns(Promise.resolve([{ name: 'shuffleTabs', shortcut: '' }])),
    },
  }

  await showShortcutLabel('shuffle', 'shuffleTabs')

  expect(document.getElementById('shuffle')?.textContent).toBe('Shuffle')
})

test('shuffle moves every tab to a random index', async () => {
  // @ts-expect-error need to find a way to type this global

  global.chrome = {
    tabs: {
      query: sinon.fake.returns(
        Promise.resolve([
          { id: 1, groupId: -1, index: 0 },
          { id: 2, groupId: -1, index: 1 },
          { id: 3, groupId: -1, index: 2 },
        ]),
      ),
      move: sinon.fake.returns(Promise.resolve()),
    },
  }

  await shuffle()

  sinon.assert.callCount(chrome.tabs.move, 3)
  sinon.assert.calledWith(chrome.tabs.move, 1)
  sinon.assert.calledWith(chrome.tabs.move, 2)
  sinon.assert.calledWith(chrome.tabs.move, 3)

  expect(
    (chrome.tabs.move as sinon.SinonStub).alwaysCalledWithMatch(
      sinon.match.number,
      sinon.match(({ index }) => {
        return index >= 0 && index < 3
      }),
    ),
  ).toBeTruthy()
})

test('merge should move all tabs to the first window', async () => {
  // @ts-expect-error need to find a way to type this global
  global.chrome = {
    tabs: {
      move: sinon.fake.returns(Promise.resolve()),
    },
    windows: {
      getAll: sinon.fake.returns(
        Promise.resolve([
          { id: 100 },
          { id: 2, tabs: [{ id: 1 }, { id: 2 }] },
          { id: 3, tabs: [{ id: 3 }, { id: 4 }] },
        ]),
      ),
    },
  }

  await merge()

  sinon.assert.callCount(chrome.tabs.move, 1)

  sinon.assert.calledWith(chrome.tabs.move, [1, 2, 3, 4], { index: -1, windowId: 100 })
})

test('snooze stores + removes inactive ungrouped tabs and leaves grouped tabs intact', async () => {
  const inactiveTabs = [
    { id: 1, groupId: -1, url: 'https://example.com/a' },
    { id: 2, groupId: -1, url: 'https://example.com/b' },
    { id: 3, groupId: 7, url: 'https://example.com/grouped' },
  ]

  // @ts-expect-error need to find a way to type this global
  global.chrome = {
    tabs: {
      query: sinon.fake.returns(Promise.resolve(inactiveTabs)),
      remove: sinon.fake(),
    },
    storage: {
      local: {
        get: sinon.fake((_key: string, callback: (result: { tabs: [] }) => void) => callback({ tabs: [] })),
        set: sinon.fake((_value: unknown, callback?: () => void) => callback?.()),
      },
    },
  }

  await snooze()

  sinon.assert.calledWith(chrome.tabs.query, { pinned: false, active: false, currentWindow: true })
  sinon.assert.calledWith(chrome.tabs.remove, [1, 2])

  const storedTabs = (chrome.storage.local.set as sinon.SinonStub).firstCall.args[0].tabs
  expect(storedTabs).toHaveLength(2)
  expect(storedTabs.map(({ url }: { url: string }) => url)).toEqual(['https://example.com/a', 'https://example.com/b'])
})

test('snoozeForSameUrl only snoozes inactive ungrouped tabs on the same host as the active tab', async () => {
  const activeTab = { id: 10, groupId: -1, url: 'https://www.example.com/current' }
  const inactiveTabs = [
    { id: 1, groupId: -1, url: 'https://example.com/a' },
    { id: 2, groupId: -1, url: 'https://other.com/b' },
    { id: 3, groupId: 7, url: 'https://example.com/grouped' },
    { id: 4, groupId: -1, url: 'https://www.example.com/c' },
  ]

  // @ts-expect-error need to find a way to type this global
  global.chrome = {
    tabs: {
      query: sinon.fake((options: { active: boolean }) => Promise.resolve(options.active ? [activeTab] : inactiveTabs)),
      remove: sinon.fake(),
    },
    storage: {
      local: {
        get: sinon.fake((_key: string, callback: (result: { tabs: [] }) => void) => callback({ tabs: [] })),
        set: sinon.fake((_value: unknown, callback?: () => void) => callback?.()),
      },
    },
    action: { setBadgeText: sinon.fake() },
  }

  await snoozeForSameUrl()

  sinon.assert.calledWith(chrome.tabs.remove, [1, 4])
  const storedTabs = (chrome.storage.local.set as sinon.SinonStub).firstCall.args[0].tabs
  expect(storedTabs.map(({ url }: { url: string }) => url)).toEqual([
    'https://example.com/a',
    'https://www.example.com/c',
  ])
})

function stubWakeUpChrome({
  lastFocusedWindowId,
  tabs,
  snoozed = [{ url: 'https://snoozed.com/a', wakeUpAt: 0 }],
}: {
  lastFocusedWindowId: number
  tabs: { id: number; windowId: number; pinned: boolean; groupId: number; active: boolean; url: string }[]
  snoozed?: SnoozedTab[]
}) {
  // @ts-expect-error need to find a way to type this global
  global.chrome = {
    tabs: {
      query: sinon.fake((options: { pinned: boolean; windowId?: number }) =>
        Promise.resolve(
          tabs.filter(
            (tab) =>
              tab.pinned === options.pinned && (options.windowId === undefined || tab.windowId === options.windowId),
          ),
        ),
      ),
      create: sinon.fake.returns(Promise.resolve()),
    },
    windows: {
      getAll: sinon.fake.returns(Promise.resolve([{ id: 1 }, { id: 2 }])),
      getLastFocused: sinon.fake.returns(Promise.resolve({ id: lastFocusedWindowId })),
    },
    storage: {
      local: {
        get: sinon.fake((_key: string, callback: (result: { tabs: SnoozedTab[] }) => void) =>
          callback({ tabs: snoozed }),
        ),
        set: sinon.fake((_value: unknown, callback?: () => void) => callback?.()),
      },
    },
    action: { setBadgeText: sinon.fake() },
  }
}

const tab = (id: number, windowId: number, pinned = false) => ({
  id,
  windowId,
  pinned,
  groupId: -1,
  active: false,
  url: `https://site${id}.com`,
})

test('wakeUpATab does nothing when the main (pinned) window is not focused', async () => {
  stubWakeUpChrome({ lastFocusedWindowId: 1, tabs: [tab(1, 1), tab(2, 2, true)] })

  expect(await wakeUpATab(15)).toBe(false)
  sinon.assert.notCalled(chrome.tabs.create)
})

test('wakeUpATab only counts tabs in the main window against maxTabs', async () => {
  // 3 tabs in the other window would exceed maxTabs=1, but only 1 lives in the main window
  stubWakeUpChrome({ lastFocusedWindowId: 2, tabs: [tab(1, 1), tab(2, 1), tab(3, 1), tab(4, 2, true), tab(5, 2)] })

  expect(await wakeUpATab(1)).toBe(true)
  sinon.assert.calledWith(chrome.tabs.create, { url: 'https://snoozed.com/a', active: false, windowId: 2 })
})

test('wakeUpATab stops when the main window has too many tabs', async () => {
  stubWakeUpChrome({ lastFocusedWindowId: 2, tabs: [tab(1, 2, true), tab(2, 2), tab(3, 2), tab(4, 1)] })

  expect(await wakeUpATab(1)).toBe(false)
  sinon.assert.notCalled(chrome.tabs.create)
})

test('wakeUpATab resolves false when no snoozed tab is due', async () => {
  stubWakeUpChrome({
    lastFocusedWindowId: 2,
    tabs: [tab(1, 2, true)],
    snoozed: [{ url: 'https://snoozed.com/a', wakeUpAt: Date.now() + 60_000 }],
  })

  expect(await wakeUpATab(15)).toBe(false)
  sinon.assert.notCalled(chrome.tabs.create)
})

test('wakeUpATab resolves false when nothing is snoozed', async () => {
  stubWakeUpChrome({ lastFocusedWindowId: 2, tabs: [tab(1, 2, true)], snoozed: undefined })
  chrome.storage.local.get = sinon.fake((_key: string, callback: (result: object) => void) => callback({}))

  expect(await wakeUpATab(15)).toBe(false)
})

test('countSnoozedTabsByHost groups tabs by host, strips www and sorts by count', () => {
  const tabs = [
    { url: 'https://www.github.com/a', wakeUpAt: 0 },
    { url: 'https://example.com/x', wakeUpAt: 0 },
    { url: 'https://github.com/b', wakeUpAt: 0 },
    { url: 'not a url', wakeUpAt: 0 },
  ]

  expect(countSnoozedTabsByHost(tabs)).toEqual([
    ['github.com', 2],
    ['example.com', 1],
    ['not a url', 1],
  ])
})
