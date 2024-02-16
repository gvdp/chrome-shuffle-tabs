# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 1.1.0 (2024-02-16)

### Features

- add action for merging all tabs ([d652297](https://github.com/gvdp/chrome-shuffle-tabs/commit/d652297c604b9f90ec45348e7d7c7cf959a45f6d))
- add command for only snoozing current tab ([4a2ae44](https://github.com/gvdp/chrome-shuffle-tabs/commit/4a2ae44d700c6b86231deddd28349739d8eab1ab))
- add key listener for triggering shuffle ([25b2648](https://github.com/gvdp/chrome-shuffle-tabs/commit/25b264843fb062dd213e64b678bf35e9f58c07ac))
- add option to only unsnooze some ([de81eb8](https://github.com/gvdp/chrome-shuffle-tabs/commit/de81eb842575359f0b6e5fe571de951279420026))
- add snooze functionality ([3626288](https://github.com/gvdp/chrome-shuffle-tabs/commit/362628841b87183bbf818df8543a9d9f727aa309))
- increase time between unsnooze ([bdbf477](https://github.com/gvdp/chrome-shuffle-tabs/commit/bdbf47730a987f17d27b217e5b9359e01fd9c7bf))
- option to disable waking up tabs ([a045fcc](https://github.com/gvdp/chrome-shuffle-tabs/commit/a045fcc47aec0924a1abd1f390d18c9e9de8e750))
- set max number of tabs to wake up ([cd477d4](https://github.com/gvdp/chrome-shuffle-tabs/commit/cd477d4cb0e8ff2d457a3c3925b5d6372a09458e))
- sort tabs by wake up time ([6482869](https://github.com/gvdp/chrome-shuffle-tabs/commit/6482869d76b897a8768131e9096550c83ddf97de))

### Bug Fixes

- correctly add snoozed tab to existing list ([d22280f](https://github.com/gvdp/chrome-shuffle-tabs/commit/d22280fd18557bebdc7ce1d188d638337b20e25c))
- count all tabs before opening new one ([b6a4bb9](https://github.com/gvdp/chrome-shuffle-tabs/commit/b6a4bb96494ce9113e315124cfef9aa23ff2c8b7))
- dont exponentionally make snooze time longer, keep it inside fixed time ([788cf51](https://github.com/gvdp/chrome-shuffle-tabs/commit/788cf51c1b82b3249f091e05351ba7dc2c481a1a))
- dont run listeners in callback so they stay active ([7d9250b](https://github.com/gvdp/chrome-shuffle-tabs/commit/7d9250b9a74dbe7b521dde00c9f75aab700aad30))
- give all snoozes different timestamp ([563d818](https://github.com/gvdp/chrome-shuffle-tabs/commit/563d818a07e0bc38b3df7d1206f70c420b1061e6))
- randomize snoozing into existing tab list ([71376e7](https://github.com/gvdp/chrome-shuffle-tabs/commit/71376e7d711d6737af4982bd3c22d0e50389d191))
- use correct tablength to determine wakeuptime ([68fac7e](https://github.com/gvdp/chrome-shuffle-tabs/commit/68fac7e4ffd2ef14bf150a6dfd3afe175bf48f40))