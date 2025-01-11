import test from 'ava'
import sinon from 'sinon'
import { shuffle } from './actions.js'

global.chrome = {
  tabs: {
    query: sinon.fake.returns(Promise.resolve([{ id: 1 }, { id: 2 }, { id: 3 }])),
    move: sinon.fake.returns(Promise.resolve()),
  },
}

test('shuffle moves every tab to a random index', async (t) => {
  await shuffle()

  t.deepEqual(chrome.tabs.move.callCount, 3)
  t.assert(chrome.tabs.move.calledWith(1))
  t.assert(chrome.tabs.move.calledWith(2))
  t.assert(chrome.tabs.move.calledWith(3))
  t.assert(
    chrome.tabs.move.alwaysCalledWithMatch(
      sinon.match.number,
      sinon.match(({ index }) => {
        return index >= 0 && index < 3
      }),
    ),
  )
})
