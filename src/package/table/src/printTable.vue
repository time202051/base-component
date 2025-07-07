<template>
  <div class="Print_box" style="width: 100%">
    <!-- 理货清单 -->
    <div
      class="Print_hader"
      style="
        text-align: center;
        font-size: 25px;
        font-weight: 500;
        margin-bottom: 15px;
      "
    >
      {{ printListObj.title }}
    </div>
    <div class="Print_body">
      <div class="Print_body_table" style="margin-bottom: 15px">
        <table
          style="
            width: 100%;
            border-collapse: collapse;
            border: 1px black solid;
            box-sizing: border-box;
          "
        >
          <thead style="display: table-header-group">
            <tr>
              <th
                v-for="(head, index) in printListObj.tableHeader"
                :key="index"
                :colspan="head.colspan"
                :style="{
                  border: '1px solid black',
                  padding: '7px',
                  fontSize: '12px',
                  width: head.width,
                  minWidth: head.width,
                  maxWidth: head.width,
                  wordBreak: 'break-all',
                  wordWrap: 'break-word',
                }"
              >
                {{ head.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in printListObj.tableData" :key="index">
              <div v-for="(head, i) in printListObj.tableHeader" :key="i">
                <td
                  v-if="item.hot == 2"
                  :style="{
                    border: '1px solid black',
                    padding: '7px',
                    fontSize: '12px',
                    width: head.width,
                    wordBreak: 'break-all',
                    wordWrap: 'break-word',
                    background: '#ccc !important',
                  }"
                >
                  <span>{{ item[head.prop] }} </span>
                </td>

                <td
                  v-else
                  :style="{
                    border: '1px solid black',
                    padding: '7px',
                    fontSize: '12px',
                    width: head.width,
                    fontWeight: head.weight,
                    wordBreak: 'break-all',
                    wordWrap: 'break-word',
                  }"
                >
                  <span>{{ item[head.prop] }} </span>
                </td>
              </div>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="Print_footer"></div>
    <div style="page-break-after: always"></div>
  </div>
</template>

<script>
export default {
  props: {
    printListObj: Object, //打印参数
  },
  data() {
    return {
      //表头
      tableHeader: [
        {
          label: "Item No",
          prop: "itemNo",
        },
        {
          label: "STO",
          prop: "sto",
        },
        {
          label: "Country of Origin",
          prop: "countryofOrigin",
        },
        {
          label: "Material",
          prop: "material",
        },
        {
          label: "Deliervy Qty",
          prop: "deliervyQty",
        },
        {
          label: "Label Req.",
          prop: "labenReq",
        },
        {
          label: "Batch",
          prop: "batch",
        },
        {
          label: "Bill of Land",
          prop: "billofLand",
        },
      ],
      //body 数据
      tableData: [
        {
          countryofOrigin: "22",
          createDate: "2020-08-03T15:10:16",
          deliervyQty: 33,
          invoice: "22",
          itemNo: "1",
          labenReq: "22",
          material: "22",
          sto: "sto",
          actualQty: 0,
          batch: "batch",
          billofLand: "billofLand",
        },
        {
          actualQty: 0,
          batch: "444",
          billofLand: "555",
          countryofOrigin: "66666",
          createDate: "2020-08-03T15:10:16",
          deliervyQty: 33,
          invoice: "6677",
          itemNo: "1",
          labenReq: "666666",
          material: "6666666",
          sto: "88888888888",
        },
      ],
    };
  },
  watch: {
    printListObj: {
      handler() {
        // debugger
      },
      deep: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.Print_box {
  width: 100%;
}
.Print_hader {
  text-align: center;
  font-size: 30px;
  font-weight: 500;
}

.Print_body_QR {
  float: right;
}
.Print_body_label {
  display: flex;
  justify-content: space-between;
}
.Print_body_table {
  // margin-bottom: 15px;
}
::v-deep .active {
  font-weight: 800 !important;
}
</style>
