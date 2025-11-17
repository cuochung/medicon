<template>
  <div class="PDDUpload">
    <div class="ImgContainer">

      <div class="existImg">
        <transition name="fade" mode="out-in" appear>
          <img v-if="props.listData.p_num.length == 13"
            :src="`${store.state.base_url}/upload/produce/${props.listData.p_num}.jpg`" @error="store.handleImageError">
          <img v-else :src="`${store.state.base_url}/upload/produce/noexist.jpg`">
        </transition>
      </div>

      <div class="centerLine"></div>

      <div v-if="selectedFile.length" class="imgPreviewZone">
        <div class="previewSub">準備上傳圖片</div>

        <div v-for="item, index in preview" :keys="index" class="imgBox">
          <img :src="item" />
          <div class="iconBox"><i class="fa-solid fa-xmark" @click="delSelectedPic(index)"></i></div>

        </div>
      </div>

      <button v-if="!selectedFile.length" @click.prevent="$refs.fileInput.click();" class="btnOptions">上傳圖片</button>

    </div>


    <!-- 上傳file用的input -->
    <input type="file" accept="image/*" ref="fileInput" multiple @change="onFileSelected" style="display: none" />

  </div>
</template>


<script setup>
import { ref, computed } from 'vue';
import { useStore } from '@/stores/useStore'
const store = useStore()
// import api from '@/assets/js/api.js'
// const $api = api

const emit = defineEmits(['returnImage'])
const props = defineProps({
  listData: {
    type: Object,
    default: {}
  }
})


const selectedFile = ref([]) //暫存上傳的檔案

//處理預覽圖顯示;長度未達13時,都顯示無圖片

//處理圖檔
const checkPicType = (file) => {
  let extension = file.name.split(".").pop().toLowerCase(); //取副檔名
  let fitType = ["gif", "png", "jpg", "jpeg"];
  let errorMsg = ""; //判斷檔案是否為圖檔及檔案大小

  if (fitType.indexOf(extension) == -1) {
    errorMsg += "檔案:" + file.name + "不是支持的影像檔案";
    // console.log('err1', errorMsg)
  }
  if (file.size > 1024 * 1024 * 5) {
    //檔案大小設定-最大5MB
    errorMsg += "檔案:" + file.name + "不能超過5M唷";
    // console.log('err2', errorMsg)
  }

  if (errorMsg == "") {
    return true;
  } else {
    return errorMsg;
  }
}

//預覽內容設為跟著上傳前暫存檔 selectedFile 的內容去顯示就好,這樣只要控制 selectedFile的值就以了.
const preview = computed(() => {
  return selectedFile.value.map(file => {
    return URL.createObjectURL(file)
  })
})

//取得圖檔及暫時顯示預覽圖-> 判斷合法的圖檔就放入selectedFile及preview裡
const onFileSelected = (event) => {
  Object.values(event.target.files).forEach((file) => {
    let checkRs = checkPicType(file);
    if (checkRs == true) {
      selectedFile.value.push(file)
    } else {
      store.showToastMulti({
        type: 'warning',
        message: checkRs,
        closeTime: 2,
      })
    }
  })

  emit("returnImage", selectedFile.value)
  //這裡加上這個可以解決刪掉同一檔又上傳同一檔案時沒有反應的情況
  event.target.value = ''
}

//刪掉上傳前的預覽圖片
const delSelectedPic = (index) => {
  selectedFile.value.splice(index, 1)
}


//執行上傳&更新原始資料 //檔案上傳 -> 多檔 ;先上傳圖檔,成功回傳的再另外寫入資料庫 "imgcontroler" 裡面
// const onUpload = async () => {
//   //判斷是否有上傳圖片
//   if (!selectedFile.value) {
//     // alert('未選擇任何檔案');
//     store.showToastMulti({
//       type: 'warning',
//       message: '未選擇任何檔案',
//       closeTime: 3,
//     })
//     return false
//   }
//   //判斷是否有寫入標題
//   if (!list.value.name) {
//     // alert('未輸入標題');
//     store.showToastMulti({
//       type: 'warning',
//       message: '未輸入標題',
//       closeTime: 3,
//     })
//     return false
//   }

//   const fd = new FormData();
//   selectedFile.value.forEach(file => {
//     fd.append("files[]", file);
//   })

//   await $api.upload(usingDatabase, fd)
//     .then((rs) => {
//       console.log('rs', rs)
//       let errorRs = rs.filter(i => i.error)
//       if (errorRs.length) {
//         // alert('上傳檔案過程有誤,請查看console')
//         store.showToast({
//           type: 'warning',
//           message: '上傳檔案過程有誤,請查看console',
//           closeTime: 5,
//         })
//         // console.log('errorRs', errorRs)
//       }

//       // let newRs = rs.filter(i => i.success)
//       // let postData = newRs.map(i => {
//       //   let item = {
//       //     title: list.value.name,
//       //     picName: i.success,
//       //     picOriginalName: i.picOriginalName,
//       //     createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
//       //   }
//       //   return {
//       //     datalist: JSON.stringify(item)
//       //   }
//       // })
//       // console.log('postData',postData)

//       // $api.addMulti(usingDatabase, postData).then(rs => {
//       //   let errorMsg = rs.filter(i => !i.state)
//       //   if (errorMsg.length) {
//       //     // alert('多筆存入過程有誤')
//       //     store.showToastMulti({
//       //       type: 'error',
//       //       message: '多筆存入過程有誤',
//       //       closeTime: 5,
//       //     })
//       //   } else {
//       //     selectedFile.value = []
//       //     // preview.value = []
//       //     // dialog.value = false
//       //     // alert('已上傳');
//       //     store.showToastMulti({
//       //       type: 'success',
//       //       message: '已上傳',
//       //       closeTime: 2,
//       //     })
//       //     getAllData()
//       //   }
//       //   // console.log(rs)
//       // })
//       //寫入資料到控制圖片的資料庫

//     });
// }
//處理圖檔end
</script>


<style scoped>
.btnOptions {
  padding: 8px 24px;
  font-size: 1.2rem;
  outline: none;
  border: 2px solid transparent;
  background: linear-gradient(145deg, #2196F3, #1976D2);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 150px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  width: auto;
  min-width: fit-content;
}

.ImgContainer {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  position: relative;
}

.ImgContainer .centerLine {
  border: 1px solid white;
  height: 100%;
  position: absolute;
  right: 50%;
}

.imgPreviewZone {
  position: relative;
}

.imgPreviewZone .imgBox {
  position: relative;
}

.imgPreviewZone .previewSub {
  position: absolute;
  color: black;
  z-index: 1;
  background-color: rgba(255, 255, 255, 0.8);
  /* border:2px black solid; */
  box-shadow: 0 0 5px black;
  padding: 5px 10px;
  border-radius: 5px;
  bottom: 0px;
  right: 10%;
}

.imgPreviewZone .iconBox {
  position: absolute;
  top: 2px;
  right: 2px;
  border-radius: 50%;
  border: 2px solid black;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  cursor: pointer;
}

.imgPreviewZone .iconBox i {
  color: black;
  font-size: 1rem;
}

.imgPreviewZone img {
  height: 150px;
}

.existImg img {
  height: 100%;
}
</style>