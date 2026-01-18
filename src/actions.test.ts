import { expect, test } from 'vitest'
import sinon from 'sinon'
import { shuffle, merge } from './actions'

test('shuffle moves every tab to a random index', async () => {
  // @ts-expect-error need to find a way to type this global

  global.chrome = {
    tabs: {
      query: sinon.fake.returns(
        Promise.resolve([
          { id: 1, groupId: -1 },
          { id: 2, groupId: -1 },
          { id: 3, groupId: -1 },
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
