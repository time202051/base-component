import inputHistory, { setVue } from './src/inputHistory'
import { setMaxRecords } from './src/inputHistoryDB'

inputHistory.install = function (Vue, options) {
  setVue(Vue)
  const count = (options && options.inputHistoryMaxCount) || 20
  setMaxRecords(count)
  Vue.directive('input-history', inputHistory)
}

export default inputHistory
