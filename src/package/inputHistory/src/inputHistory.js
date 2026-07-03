import { addRecord, getRecords } from './inputHistoryDB'
import DropdownComponent from './dropdown.vue'

/**
 * 简单字符串哈希（djb2），输出 8 位 hex
 */
function hashCode(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & hash // 32-bit
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/**
 * 获取路由 path（hash 模式，含查询参数以区分同级复制菜单）
 */
function getRoutePath() {
  try {
    const raw = window.location.hash.replace(/^#/, '') || '/'
    // 保留查询参数：hash 模式 URL 为 #/app/list?menuId=123
    return raw
  } catch (e) {
    return '/'
  }
}

/**
 * 获取元素 DOM 路径（相对于 body，CSS selector 风格，包含 nth-child 区分兄弟元素）
 */
function getDOMPath(el) {
  const parts = []
  let current = el
  while (current && current !== document.body) {
    let seg = current.tagName.toLowerCase()
    if (current.id) { seg += '#' + current.id; parts.unshift(seg); break }
    if (current.className && typeof current.className === 'string') {
      const cls = current.className.trim().split(/\s+/).slice(0, 2).join('.')
      if (cls) seg += '.' + cls
    }
    // 兄弟索引，区分同级同名元素
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children)
        .filter(c => c.tagName === current.tagName)
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1
        seg += ':nth-child(' + idx + ')'
      }
    }
    parts.unshift(seg)
    current = current.parentElement
  }
  return parts.join('>')
}

/**
 * 从 VNode 提取 v-model 绑定表达式
 * Vue 2 在组件 v-model 编译时会把原始表达式存入 $vnode.data.model.expression
 * 例如 v-model="formSearch[item.value]" → "formSearch[item.value]"
 * 这个表达式不受 DOM 顺序影响，是天然稳定的业务标识
 */
function getVModelExpression(el) {
  try {
    const vm = el.__vue__
    if (vm && vm.$vnode && vm.$vnode.data && vm.$vnode.data.model) {
      return vm.$vnode.data.model.expression || null
    }
  } catch (e) { /* ignore */ }
  return null
}

/**
 * 沿 DOM 树向上查找 el-form-item，再找 el-form，提取 prop + form 上下文。
 * 不能用 Vue 组件树（$parent），因为 slot 作用域会导致 $parent 跳过中间组件。
 * 返回 { prop, formKey } 或 null
 */
function getFormContext(el) {
  // 沿 DOM 向上找 .el-form-item
  let formItemEl = el.parentElement
  while (formItemEl && formItemEl !== document.body) {
    if (formItemEl.classList.contains('el-form-item')) break
    formItemEl = formItemEl.parentElement
  }
  if (!formItemEl || formItemEl === document.body) return null

  const formItemVm = formItemEl.__vue__
  const prop = formItemVm && formItemVm.prop
  if (!prop || typeof prop !== 'string') return null

  // 继续沿 DOM 向上找 .el-form
  let formEl = formItemEl.parentElement
  while (formEl && formEl !== document.body) {
    if (formEl.classList.contains('el-form')) break
    formEl = formEl.parentElement
  }
  const formKey = (formEl && formEl !== document.body)
    ? hashCode(getDOMPath(formEl))
    : ''

  return { prop, formKey }
}

/**
 * 自动推断唯一 Key，完全无感，优先级从高到低：
 *   1. binding.value       — 显式传入 v-input-history="'myKey'"
 *   2. el-form-item.prop   — 在表单内时自动提取（v-for 安全，prop 已求值为具体值）
 *   3. v-model 表达式       — 从 VNode 自动提取（独立输入框，不在 v-for 中时可靠）
 *   4. DOM 路径哈希         — 兜底
 *
 * 注意：② 必须在 ③ 之前，因为 v-for 内的 v-model 表达式是同一字面字符串，
 * 但 el-form-item.prop 在每次迭代中已求值为不同值。
 */
function resolveKey(el, binding) {
  const route = getRoutePath()

  // 1. 显式传入
  if (typeof binding.value === 'string' && binding.value) return binding.value

  // 2. el-form-item.prop（表单内，v-for 安全）
  const ctx = getFormContext(el)
  if (ctx) return route + '|' + ctx.formKey + '|' + ctx.prop

  // 3. v-model 表达式（独立输入框，不在 v-for 中）
  const expr = getVModelExpression(el)
  if (expr) return route + '|' + expr

  // 4. DOM 路径哈希（兜底）
  return hashCode(route + '|' + getDOMPath(el))
}

/**
 * 定位下拉面板
 */
function positionDropdown(dropdownEl, inputEl) {
  if (!dropdownEl || !inputEl) return
  const rect = inputEl.getBoundingClientRect()
  dropdownEl.style.position = 'fixed'
  dropdownEl.style.top = (rect.bottom + 4) + 'px'
  dropdownEl.style.left = rect.left + 'px'
  dropdownEl.style.minWidth = rect.width + 'px'
}

/**
 * 模块级 Vue 引用，通过 install 设置，确保使用消费方项目的 Vue 实例
 */
let _Vue = null

export function setVue(vue) {
  _Vue = vue
}

/**
 * 创建下拉面板实例
 */
function createDropdown() {
  const DropdownConstructor = _Vue.extend(DropdownComponent)
  const instance = new DropdownConstructor({
    propsData: {
      visible: false,
      records: [],
      selectedIndex: -1
    }
  })
  instance.$mount()
  document.body.appendChild(instance.$el)
  return instance
}

export default {
  inserted(el, binding) {
    // 找到 el-input 内部的 input/textarea
    const inputEl = el.querySelector('input, textarea')
    if (!inputEl) return

    const historyKey = resolveKey(el, binding)

    // 跳过 password / readonly / disabled
    if (inputEl.type === 'password' || inputEl.readOnly || inputEl.disabled) return

    // 创建下拉面板
    const dropdown = createDropdown()
    const dropdownEl = dropdown.$el

    // 滚动/缩放重新定位
    function onScrollResize() {
      positionDropdown(dropdownEl, inputEl)
    }

    // 点击外部关闭（排除 el-input 内部任意元素，如 clearable × 图标）
    function onClickOutside(e) {
      if (dropdownEl && !dropdownEl.contains(e.target) && !el.contains(e.target)) {
        closeDropdown()
      }
    }

    // 关闭下拉
    function closeDropdown() {
      dropdown.visible = false
      dropdown.selectedIndex = -1
      window.removeEventListener('scroll', onScrollResize, true)
      window.removeEventListener('resize', onScrollResize)
      document.removeEventListener('click', onClickOutside)
    }

    // 打开下拉
    function openDropdown() {
      getRecords(historyKey).then((records) => {
        dropdown.records = records
        dropdown.setQuery(inputEl.value || '')
        dropdown.selectedIndex = -1
        dropdown.visible = true
        positionDropdown(dropdownEl, inputEl)
        window.addEventListener('scroll', onScrollResize, true)
        window.addEventListener('resize', onScrollResize)
        document.addEventListener('click', onClickOutside)
      })
    }

    // 选中某条记录（value 现在是纯字符串）
    function selectRecord(value) {
      if (!value) return
      addRecord(historyKey, value)
      inputEl.value = value
      inputEl.dispatchEvent(new Event('input', { bubbles: true }))
      inputEl.dispatchEvent(new Event('change', { bubbles: true }))
      closeDropdown()
      inputEl.blur()
    }

    let blurTimer = null

    function onFocus() {
      clearTimeout(blurTimer)
      openDropdown()
    }

    function onInput() {
      dropdown.setQuery(inputEl.value || '')
      dropdown.selectedIndex = -1
      // 兜底：clearable 等操作可能已关闭面板，有输入内容就必须打开
      if (inputEl.value && !dropdown.visible) {
        dropdown.visible = true
        positionDropdown(dropdownEl, inputEl)
        window.addEventListener('scroll', onScrollResize, true)
        window.addEventListener('resize', onScrollResize)
        document.addEventListener('click', onClickOutside)
      }
    }

    function onKeydown(e) {
      if (e.key === 'Enter') {
        if (dropdown.visible) {
          e.preventDefault()
          const items = dropdown.filteredRecords
          const len = items.length
          if (dropdown.selectedIndex >= 0 && dropdown.selectedIndex < len) {
            selectRecord(items[dropdown.selectedIndex])
          } else if (len > 0) {
            selectRecord(items[0])
          }
          return
        }
        // 面板未显示时，直接保存当前输入
        e.preventDefault()
        saveCurrentValue()
        return
      }

      if (!dropdown.visible) return
      const items = dropdown.filteredRecords
      const len = items.length

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          dropdown.selectedIndex = dropdown.selectedIndex < len - 1 ? dropdown.selectedIndex + 1 : 0
          break
        case 'ArrowUp':
          e.preventDefault()
          dropdown.selectedIndex = dropdown.selectedIndex > 0 ? dropdown.selectedIndex - 1 : len - 1
          break
        case 'Escape':
          e.preventDefault()
          closeDropdown()
          break
      }
    }

    function saveCurrentValue() {
      const value = (inputEl.value || '').trim()
      if (value) {
        addRecord(historyKey, value)
      }
    }

    function onBlur() {
      blurTimer = setTimeout(() => {
        saveCurrentValue()
        closeDropdown()
      }, 200)
    }

    // 绑定事件
    inputEl.addEventListener('focus', onFocus)
    inputEl.addEventListener('input', onInput)
    inputEl.addEventListener('keydown', onKeydown)
    inputEl.addEventListener('blur', onBlur)
    dropdown.$on('select', selectRecord)

    // 保存引用
    el._inputHistory = {
      historyKey,
      dropdown,
      dropdownEl,
      inputEl,
      selectRecord,
      closeDropdown,
      openDropdown,
      onFocus,
      onInput,
      onKeydown,
      onBlur,
      onScrollResize,
      onClickOutside
    }
  },

  unbind(el) {
    const data = el._inputHistory
    if (!data) return

    if (data.inputEl) {
      data.inputEl.removeEventListener('focus', data.onFocus)
      data.inputEl.removeEventListener('input', data.onInput)
      data.inputEl.removeEventListener('keydown', data.onKeydown)
      data.inputEl.removeEventListener('blur', data.onBlur)
    }

    window.removeEventListener('scroll', data.onScrollResize, true)
    window.removeEventListener('resize', data.onScrollResize)
    document.removeEventListener('click', data.onClickOutside)

    if (data.dropdown) {
      data.dropdown.$off('select', data.selectRecord)
      data.dropdown.$destroy()
      if (data.dropdownEl && data.dropdownEl.parentNode) {
        data.dropdownEl.parentNode.removeChild(data.dropdownEl)
      }
    }

    delete el._inputHistory
  }
}
