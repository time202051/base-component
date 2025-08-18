// 1缓存获取 2如果没有就全局接口获取
export const getEnum = enumName => {
  const local = localStorage.getItem("wms");
  if (!local) return [];
  // enumName首字母转成小写
  const enumStr = enumName[0].toLowerCase() + enumName.slice(1);
  return JSON.parse(local).SET_enumsSelect[enumStr].enums || [];
};
