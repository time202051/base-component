import inputHistory from './src/inputHistory'

inputHistory.install = function (Vue) {
  Vue.directive('input-history', inputHistory)
}

export default inputHistory
