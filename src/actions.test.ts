import { expect, test } from 'vitest'
import sinon from 'sinon'
import { shuffle, merge, snooze, showShortcutLabel } from './actions'

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
