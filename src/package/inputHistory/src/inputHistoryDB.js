/**
 * IndexedDB 封装层 — 输入历史记录存储
 *
 * 数据库: InputHistoryDB
 * Store:  history
 * 主键:   id（即传入的 historyKey）
 *
 * 数据格式: { id: 'sapSaleorder:search', values: ['abc', 'xyz', ...] }
 * 每个 id 最多 10 条，自动去重，最新输入的排在最前面
 */

let db = null

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db)

    const request = window.indexedDB.open('InputHistoryDB', 2)

    request.onupgradeneeded = (e) => {
      const database = e.target.result
      // 删除旧版本 store（如果存在）
      if (database.objectStoreNames.contains('history')) {
        database.deleteObjectStore('history')
      }
      // 创建新的简单 store，keyPath 为 id
      database.createObjectStore('history', { keyPath: 'id' })
    }

    request.onsuccess = (e) => {
      db = e.target.result
      resolve(db)
    }

    request.onerror = (e) => {
      console.warn('[inputHistoryDB] 无法打开 IndexedDB:', e.target.error)
      reject(e.target.error)
    }
  })
}

/**
 * 添加记录
 * @param {string} id - 唯一标识 Key
 * @param {string} value - 要保存的值
 */
export function addRecord(id, value) {
  if (!id || !value) return Promise.resolve()

  return openDB().then((database) => {
    return new Promise((resolve) => {
      const tx = database.transaction('history', 'readwrite')
      const store = tx.objectStore('history')

      const getReq = store.get(id)
      getReq.onsuccess = () => {
        const existing = getReq.result
        let values = existing ? [...existing.values] : []

        // 去重：移除已存在的相同值
        values = values.filter((v) => v !== value)
        // 添加到最前面
        values.unshift(value)
        // 最多保留 10 条
        values = values.slice(0, 10)

        store.put({ id, values })
      }

      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  }).catch(() => {})
}

/**
 * 获取历史记录列表
 * @param {string} id
 * @returns {Promise<string[]>}
 */
export function getRecords(id) {
  if (!id) return Promise.resolve([])

  return openDB().then((database) => {
    return new Promise((resolve) => {
      const tx = database.transaction('history', 'readonly')
      const store = tx.objectStore('history')

      const getReq = store.get(id)
      getReq.onsuccess = () => {
        const result = getReq.result
        resolve(result ? result.values : [])
      }
      getReq.onerror = () => resolve([])
    })
  }).catch(() => [])
}

/**
 * 删除 id 对应的所有历史记录
 * @param {string} id
 */
export function deleteRecords(id) {
  if (!id) return Promise.resolve()

  return openDB().then((database) => {
    return new Promise((resolve) => {
      const tx = database.transaction('history', 'readwrite')
      const store = tx.objectStore('history')
      store.delete(id)
      tx.oncomplete = () => resolve()
    })
  }).catch(() => {})
}
