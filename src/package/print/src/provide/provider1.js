import { hiprint } from "vue-plugin-hiprint";

export const provider1 = function () {
  const addElementTypes = context => {
    context.removePrintElementTypes("providerModule1");
    context.addPrintElementTypes("providerModule1", [
      new hiprint.PrintElementTypeGroup("常规", [
        {
          tid: "providerModule2.customText",
          title: "文本",
          customText: "自定义文本",
          custom: true,
          type: "text",
          options: {
            field: "name",
            testData: "内容",
          },
        },
        {
          tid: "providerModule2.longText",
          title: "长文本",
          type: "longText",
          options: {
            field: "test.longText",
            width: 200,
            testData: "长文本分页/不分页测试",
          },
        },
        {
          tid: "providerModule1.type",
          title: "纯文本",
          data: "纯文本",
          type: "text",
          options: {
            testData: "纯文本",
            height: 16,
            fontSize: 15,
            fontWeight: "700",
            textAlign: "center",
            hideTitle: true,
          },
        },
        {
          tid: "providerModule1.platform",
          title: "标题",
          data: "标题",
          type: "text",
          options: {
            field: "platform",
            testData: "平台名称",
            height: 17,
            fontSize: 16.5,
            fontWeight: "700",
            textAlign: "center",
            hideTitle: true,
          },
        },
        {
          tid: "providerModule2.table",
          title: "表格",
          type: "table",
          options: {
            field: "table",
            fields: [
              //   { text: "名称", field: "name1" },
              //   { text: "性别", field: "gender" },
              //   { text: "数量", field: "count" },
              //   { text: "金额", field: "amount" },
            ],
          },
          columns: [
            [
              { title: "名称", align: "center", field: "name" },
              { title: "性别", align: "center", field: "gender" },
              { title: "数量", align: "center", field: "count" },
              { title: "金额", align: "center", field: "amount" },
            ],
          ],
          //   footerFormatter: function (options, rows, data, currentPageGridRowsData) {
          //     console.log(currentPageGridRowsData);
          //     if (data && data["totalCap"]) {
          //       return `<td style="padding:0 10px" colspan="100">${
          //         "应收金额大写: " + data["totalCap"]
          //       }</td>`;
          //     }
          //     return '<td style="padding:0 10px" colspan="100">应收金额大写: </td>';
          //   },
        },
        {
          tid: "providerModule1.barcode",
          title: "条形码",
          data: "XS888888888",
          type: "text",
          options: {
            field: "barcode",
            testData: "XS888888888",
            height: 32,
            fontSize: 12,
            lineHeight: 18,
            textAlign: "left",
            textType: "barcode",
          },
        },
        {
          tid: "providerModule1.qrcode",
          title: "二维码",
          data: "XS888888888",
          type: "text",
          options: {
            field: "qrcode",
            testData: "XS888888888",
            height: 32,
            fontSize: 12,
            lineHeight: 18,
            textType: "qrcode",
          },
        },

        {
          tid: "providerModule1.image",
          title: "图片",
          data: "",
          type: "image",
        },
      ]),
      new hiprint.PrintElementTypeGroup("定制", [
        {
          tid: "providerModule1.khname",
          title: "客户名称",
          data: "高级客户",
          type: "text",
          options: {
            field: "name",
            testData: "高级客户",
            height: 16,
            fontSize: 6.75,
            fontWeight: "700",
            textAlign: "left",
            textContentVerticalAlign: "middle",
          },
        },
        {
          tid: "providerModule1.tel",
          title: "客户电话",
          data: "18888888888",
          type: "text",
          options: {
            field: "tel",
            testData: "18888888888",
            height: 16,
            fontSize: 6.75,
            fontWeight: "700",
            textAlign: "left",
            textContentVerticalAlign: "middle",
          },
        },
        {
          tid: "providerModule1.order",
          title: "订单编号",
          data: "XS888888888",
          type: "text",
          options: {
            field: "order",
            testData: "XS888888888",
            height: 16,
            fontSize: 6.75,
            fontWeight: "700",
            textAlign: "left",
            textContentVerticalAlign: "middle",
          },
        },
        {
          tid: "providerModule1.date",
          title: "业务日期",
          data: "2020-01-01",
          type: "text",
          options: {
            field: "date",
            testData: "2020-01-01",
            height: 16,
            fontSize: 6.75,
            fontWeight: "700",
            textAlign: "left",
            textContentVerticalAlign: "middle",
          },
        },
      ]),
      new hiprint.PrintElementTypeGroup("辅助", [
        {
          tid: "providerModule2.hline",
          title: "横线",
          type: "hline",
        },
        {
          tid: "providerModule2.vline",
          title: "竖线",
          type: "vline",
        },
        {
          tid: "providerModule2.rect",
          title: "矩形",
          type: "rect",
        },
        {
          tid: "providerModule2.oval",
          title: "椭圆",
          type: "oval",
        },
      ]),
    ]);
  };
  return {
    addElementTypes,
  };
};
