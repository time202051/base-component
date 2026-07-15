/**
 * 生成范围选择器的快捷选项
 * 每次调用基于当前日期重新计算，保证日期始终是最新的。
 * 包含：今天、昨天、本周、上周、本月、上月、本季度、本年，
 *       最近一周/一个月/三个月/半年/一年
 */
const buildRangePickerOptions = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();
  const weekDay = now.getDay(); // 0=周日, 1=周一 ...

  // 今天
  const todayStart = new Date(year, month, day);
  const todayEnd = new Date(year, month, day, 23, 59, 59);

  // 昨天
  const yesterdayStart = new Date(year, month, day - 1);
  const yesterdayEnd = new Date(year, month, day - 1, 23, 59, 59);

  // 本周（周一 ~ 周日）
  const mondayOffset = weekDay === 0 ? -6 : 1 - weekDay;
  const thisWeekStart = new Date(year, month, day + mondayOffset);
  const thisWeekEnd = new Date(year, month, day + mondayOffset + 6, 23, 59, 59);

  // 上周（上周一 ~ 上周日）
  const lastWeekStart = new Date(year, month, day + mondayOffset - 7);
  const lastWeekEnd = new Date(year, month, day + mondayOffset - 1, 23, 59, 59);

  // 本月
  const thisMonthStart = new Date(year, month, 1);
  const thisMonthEnd = new Date(year, month + 1, 0, 23, 59, 59);

  // 上月
  const lastMonthStart = new Date(year, month - 1, 1);
  const lastMonthEnd = new Date(year, month, 0, 23, 59, 59);

  // 本季度
  const quarterStartMonth = Math.floor(month / 3) * 3;
  const thisQuarterStart = new Date(year, quarterStartMonth, 1);
  const thisQuarterEnd = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59);

  // 本年
  const thisYearStart = new Date(year, 0, 1);
  const thisYearEnd = new Date(year, 11, 31, 23, 59, 59);

  // 最近一周（过去7天）
  const last7DaysStart = new Date(year, month, day - 6);
  const last7DaysEnd = new Date(year, month, day, 23, 59, 59);

  // 最近一个月（过去30天）
  const last30DaysStart = new Date(year, month, day - 29);

  // 最近三个月
  const threeMonthStart = new Date(year, month - 2, 1);

  // 最近半年
  const sixMonthStart = new Date(year, month - 5, 1);

  // 最近一年
  const lastYearStart = new Date(year, month - 11, 1);

  return {
    shortcuts: [
      {
        text: "本周",
        onClick(picker) {
          picker.$emit("pick", [thisWeekStart, thisWeekEnd]);
        },
      },
      {
        text: "最近三个月",
        onClick(picker) {
          picker.$emit("pick", [threeMonthStart, thisMonthEnd]);
        },
      },
      {
        text: "最近半年",
        onClick(picker) {
          picker.$emit("pick", [sixMonthStart, thisMonthEnd]);
        },
      },
      {
        text: "今天",
        onClick(picker) {
          picker.$emit("pick", [todayStart, todayEnd]);
        },
      },
      {
        text: "昨天",
        onClick(picker) {
          picker.$emit("pick", [yesterdayStart, yesterdayEnd]);
        },
      },

      {
        text: "上周",
        onClick(picker) {
          picker.$emit("pick", [lastWeekStart, lastWeekEnd]);
        },
      },
      {
        text: "本月",
        onClick(picker) {
          picker.$emit("pick", [thisMonthStart, thisMonthEnd]);
        },
      },
      {
        text: "上月",
        onClick(picker) {
          picker.$emit("pick", [lastMonthStart, lastMonthEnd]);
        },
      },
      {
        text: "本季度",
        onClick(picker) {
          picker.$emit("pick", [thisQuarterStart, thisQuarterEnd]);
        },
      },
      {
        text: "本年",
        onClick(picker) {
          picker.$emit("pick", [thisYearStart, thisYearEnd]);
        },
      },
      {
        text: "最近一周",
        onClick(picker) {
          picker.$emit("pick", [last7DaysStart, last7DaysEnd]);
        },
      },
      {
        text: "最近一个月",
        onClick(picker) {
          picker.$emit("pick", [last30DaysStart, todayEnd]);
        },
      },
      {
        text: "最近一年",
        onClick(picker) {
          picker.$emit("pick", [lastYearStart, thisMonthEnd]);
        },
      },
    ],
  };
};

/**
 * settingJson 数据转换 & 清理
 * 接收 by-menu 接口返回的全部数据 + 已解析的 configList，
 * 1. 清理非范围日期选择器上残留的 pickerOptions
 * 2. 为范围日期选择器重新绑定快捷选项 onClick（JSON 序列化后函数会丢失）
 */
const convertSettingJson = (byMenuData, { configList }, formSearch = {}) => {
  const { defaultFilterJson, settingJson, customSearch } = byMenuData;
  const tempDefaultFilterJson = defaultFilterJson ? JSON.parse(defaultFilterJson) : null;
  const tempCustomSearch = customSearch ? JSON.parse(customSearch) : null;
  const tempSettingJson = settingJson ? JSON.parse(settingJson) : null;

  console.log("999接口数据", tempDefaultFilterJson, tempSettingJson, tempCustomSearch);
  let changed = false;

  /**
   * 修正 formSearch[key] 的值类型（数组 ⇄ 字符串），
   * 如果值确实被修改了，同步从 tempDefaultFilterJson 和 tempCustomSearch
   * 中删除该 key 对应的已保存条件。
   * @returns {boolean} 是否实际修改了值
   */
  const clearValue = (formSearch, key, targetType) => {
    const val = formSearch[key];
    const isArray = Array.isArray(val);

    if (targetType === "string" && isArray) {
      formSearch[key] = "";
      changed = true;
    } else if (targetType === "array" && !isArray) {
      formSearch[key] = [];
      changed = true;
    }

    if (changed) {
      // 从保存的搜索条件中删除
      if (tempDefaultFilterJson && tempDefaultFilterJson.filterConditions) {
        tempDefaultFilterJson.filterConditions = tempDefaultFilterJson.filterConditions.filter(
          item => item.key !== key
        );
      }
    }
  };

  // 时间范围 / 非范围字段数据处理
  configList.forEach(item => {
    if (item.inputType !== "picker") return;
    if (["datetimerange", "daterange"].includes(item.dateType)) {
      item.props.pickerOptions = buildRangePickerOptions();
      clearValue(formSearch, item.value, "array");
    } else {
      delete item.props.pickerOptions;
      if (item.dateType == "monthrange") {
        clearValue(formSearch, item.value, "array");
      } else {
        clearValue(formSearch, item.value, "string");
      }
    }
  });
  return {
    isDefaultFilterJson: changed,
    defaultFilterJson: JSON.stringify(tempDefaultFilterJson),
  };
};

export { buildRangePickerOptions, convertSettingJson };
