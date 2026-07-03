import inputHistory, { setVue } from './src/inputHistory'

inputHistory.install = function (Vue) {
  setVue(Vue)
  Vue.directive('input-history', inputHistory)
}

export default inputHistory
export { setVue }
