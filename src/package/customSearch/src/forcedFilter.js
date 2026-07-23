// ============================================================
//  强制筛选条件 —— 通过 Vue.prototype.$getFilterConditions 挂载
//  场景 B：消费项目没有搜索框组件，但仍需要拿 admin 配置的强制筛选条件
//  调用方式：await this.$getFilterConditions(filterConditions, menuId)
// ============================================================

// 自动检测当前页面对应的 menuId
// 与 columnConfig resolveMenuId 一致的实现，只是不依赖 this.$route / this.menuId
function detectCurrentMenuId() {
  try {
    var wms = JSON.parse(localStorage.getItem("wms") || "{}");
    var menus = wms.SET_MENUS;
    if (!menus) return "";
    // 从 window.location 获取当前路径（兼容 hash 和 history 路由）
    var path = window.location.hash
      ? window.location.hash.replace(/^#/, "")
      : window.location.pathname;
    var find = function (arr) {
      for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (item.path === path) return item;
        if (item.child && item.child.length > 0 && item.type !== 1) {
          var found = find(item.child);
          if (found) return found;
        }
      }
      return null;
    };
    var m = find(menus);
    return (m && m.id) || "";
  } catch (e) {
    return "";
  }
}

// 解析 adminDefaultFilterJson 提取完整数据
export function parseForcedFilter({ adminDefaultFilterJson }) {
  if (!adminDefaultFilterJson) return {};
  return JSON.parse(adminDefaultFilterJson);
}

// 合并两个 filterConditions 数组，按 key 去重，forced 优先
function mergeFilterConditions(userConditions, forcedConditions) {
  var map = {};
  (userConditions || []).forEach(function (c) {
    if (c.key) map[c.key] = c;
  });
  (forcedConditions || []).forEach(function (c) {
    if (c.key) map[c.key] = c;
  });
  var result = [];
  Object.keys(map).forEach(function (k) {
    result.push(map[k]);
  });
  return result;
}

function isDefaultFilterAdmin() {
  const val = this.$olBaseConfig && this.$olBaseConfig.isDefaultFilterAdmin;
  if (typeof val === "function") return val();
  return !!val;
}

/**
 * 获取 admin 配置的强制筛选条件，支持与传入条件按 key 合并去重（强制条件权重高）
 *
 * 通过 Vue.prototype.$getFilterConditions 挂载到组件实例上使用：
 *   const merged = await this.$getFilterConditions(myConditions);
 *   const merged = await this.$getFilterConditions(myConditions, 'my_menu_id');
 *
 * @param {Array}  [filterConditions=[]]   - 已有筛选条件，参与合并
 * @param {string} [menuId]               - 可选，不传则从当前路由自动检测
 * @returns {Promise<Array>} 合并去重后的 filterConditions
 */
export async function getFilterConditions(filterConditions, menuId) {
  if (isDefaultFilterAdmin.call(this)) return mergeFilterConditions(filterConditions, []);
  if (!Array.isArray(filterConditions)) filterConditions = [];
  const id = menuId || detectCurrentMenuId();
  if (!id) return mergeFilterConditions(filterConditions, []);
  try {
    const res = await this.get({
      url: "/api/app/menu-search-setting/by-menu",
      data: { sysMenuId: id },
    });

    if (res.code !== 200) return mergeFilterConditions(filterConditions, []);
    const adminDefaultFilterJson = JSON.parse(res.result.adminDefaultFilterJson);
    return mergeFilterConditions(filterConditions, adminDefaultFilterJson.filterConditions);
  } catch (e) {
    return mergeFilterConditions(filterConditions, []);
  }
}

