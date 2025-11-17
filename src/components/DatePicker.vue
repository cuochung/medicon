<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :nudge-right="40"
    transition="scale-transition"
    offset-y
    min-width="290px"
  >
    <template v-slot:activator="{ on }">
      <v-text-field :label="label" :value="date" v-on="on" ></v-text-field>
    </template>
    <v-date-picker v-model="date" @input="menu = false" @change="confirm" locale="zh-tw"></v-date-picker>
  </v-menu>
</template>

<script>
export default {
  props: ["label", "msg"],
  data: () => ({
    // label: this.label,
    date: "",
    menu: false
  }),
  model: {
    prop: "msg",
    event: "datapicker"
  },
  mounted(){
    this.date = this.msg;
  },
  methods: {
    confirm() {
      //   console.log(this.msg);
      this.menu = false;
      this.$emit("datapicker", this.date);
    }
  },
  watch: {
    msg(nv, ov) {
      if (this.msg == "0000-00-00") {
        this.date = '';
      } else {
        this.date = this.msg;
      }
    }
  }
};
</script>