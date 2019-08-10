<template>
  <div v-if="params" class="message">
    <div @click="isShowEmoji=false" v-show="isShowMessageBox" class="messagebox">
      <div class="headerbox">
        <span class="title">客服</span>
        <div class="btns">
        <span @click="isShowMessageBox=false" class="close">×</span>
        </div>
      </div>
      <!-- 聊天展示区域 -->
      <div id="meslist" class="meslist common-scroll-bar">
        <div v-for="(item,index) in meslist"
        class="item"
        :class="{on:item.senderUserId==userId ||
        item.senderUserId == getExtraByType(item.content.extra,'userId')}"
        :key="index"
        :ref="index">
          <template v-if="item.content.messageName == 'TextMessage'">
          <!-- 文本消息 -->
            <div v-html="emojiToHtml(item.content.content)" class="mes">
            </div>
          </template>


          <template v-if="item.content.messageName == 'ImageMessage'">
            <!-- 图文消息 -->
            <div class="imgbox mes"
            @click="imgClick(item)"
            :class="{finish:!item.uploading}">
              <img :id="item.id" :src="item.content.content">
            </div>
          </template>

          <template v-if="item.content.messageName == 'FileMessage'">
            <!-- 文件消息 -->
            <div class="filebox imgbox mes"
            @click="imgClick(item)"
            :class="{finish:!item.uploading}">
              <a href="javascript:">{{item.content.name}}</a>
            </div>
          </template>


        </div >
      </div>

      <!-- 发送区域 -->
      <div class="sendbox">
        <div class="btns">
          <span @click.stop="emojiClick" class="iconfont icon-emoji"></span>

          <span @click="upload('img')" class="iconfont icon-tupian"></span>


          <span @click="upload('file')" class="iconfont icon-wenjian"></span>

          <span @click="initGroupFn('group1')" class="iconfont icon-wenjian"></span>


        </div>
        <div class="inp">
          <div v-if="isShowEmoji && emojiList.length>0"
          @click.stop
          class="emojibox">
             <div class="item" v-for="(item,index) in emojiList"
             @click="emojiClickItem(item)"
             :key="index" v-html="item.node.outerHTML">
             </div >
          </div>
          <textarea id="rongCloudTextarea"

          v-model="mesData" placeholder="说点什么吧"></textarea>
        </div>
      </div>
      <div class="sub" @click="sendMessageFn('TextMessage')">发送</div>


      <!-- 上传压缩相关隐藏dom -->
      <input style="display:none;"
          @change="fileChange($event,'img')"
          accept="image/jpeg,image/jpg,image/gif,image/png,image/bmp"
          ref="picture"
          type="file" id="picture" name="picture">
          <input
          @change="fileChange($event,'file')"
          ref="file"
          style="display:none;" type="file" id="file" name="file">
      <canvas id="canvas" style="display:none;"></canvas>

    </div>
  </div>
</template>
<script>
import {
  rongInit, getemojiList, emojiToHtml, sendMessage, initGroup,
} from './js/init';
/*eslint-disable*/ 
export default {
  name: 'message',
  data() {
    return {
      name: 'message',
      showDatas: [],
      mesData: '', // 发送信息
      meslist: [],
      emojiList: [],
      isShowMessageBox: false,
      isShowEmoji: false,
      imgMaxSize: 500, // 图片大小
      targetIdList:[],
      messageData:{
        content:{
          content:'',
          messageName:'',
          extra:{
          },
        }
      }
    };
  },
  props: {
    params: { // appkey token navi
      type: Object,
      default: () => null,
    },
    targetId: {
      type: String,
      default: () => '001',
    },
  },
  mounted() {
    // this.init()
    this.targetIdList=[this.targetId];
  },
  methods: {
    async initGroupFn(chatRoomId,type){
      let res = await initGroup(chatRoomId,type);
      console.log(res);
    },
    async sendMessageFn(messageName){
      // 发送消息
      if(!messageName){
        // 如果没有消息类型 返回
        return false;
      }
      if(messageName === 'TextMessage'){
        // 文本消息
        this.messageData.content.content = this.mesData;
      }
      this.messageData.content.messageName = messageName;
      let res = await sendMessage(this.targetIdList,this.messageData);
      this.sendMesResult(res);
     
    },
    sendMesResult(res){
       console.log(res);
      if(res.code === '0000'){
        // 发送成功
        if(res.message.content.messageName === 'TextMessage'){
          this.mesData = '';
          this.pushList(res.message);
        }else{
          this.finish(res.message);
        }
      }
    },
    pushList(data) {
      this.meslist.push({
        id: this.meslist.length,
        ...data,
      });
      console.log(this.meslist);
      this.scrollEnd();
    },
    emojiToHtml(mes){
      return emojiToHtml(mes)
    },
    scrollEnd(){
      // 滚动到底部
      this.$nextTick(() => {
        // 滚动到底部
        let ele = document.getElementById('meslist');
        ele.scrollTop = ele.scrollHeight;
      });
    },
    addPromptInfo(res) {
      console.log(res);
      if (res.code === '9999') {
        // 收到消息
        this.pushList(res.data);
      }else if(res.code === '0000'){
        // 拿到userid
        this.setUserId(res.data)
      }
    },
    init() {

      if (this.params && this.params.appkey && this.params.token) {
        this.isShowMessageBox = true;
        rongInit(this.params, this.addPromptInfo);
      } else {
        throw new Error('appkey 和 token 不能为空');
      }
    },
    imgClick(item){
      console.log(item,'点击图片消息');
      if(item.content.messageName === 'ImageMessage'){
        window.open(item.content.imageUri,'_blank');
      }else{
        window.open(item.content.fileUri,'_blank');
      }
    },
    dispatch(el, type) {
      let t = type || 'click';
      let event = document.createEvent('MouseEvents');
      event.initMouseEvent('click', false, false);
      el.dispatchEvent(event);
    },
    
    uploadImg(content){
      // 上传图片 content base64
      this.setExtraByType('index',this.meslist.length);
        this.pushList({
          content: {
            messageName: 'ImageMessage',
            content: content,
            imageUri: '',
          },
          uploading: true,
          messageType: 'ImageMessage',
          senderUserId: this.userId,
        });
        // 发送图片消息
        this.messageData.content.content = content;
        this.messageData.content.imageUri = '//www.baidu.com/img/bd_logo1.png?qua=high';
        this.sendMessageFn('ImageMessage');
      
    },
    async uploadFile(file){
      let content = {
        name:file.name,
        size:file.size,
        type:file.type,
        extra:this.messageData.content.extra,
        fileUrl: '//cdn.ronghub.com/RongIMLib-2.5.0.min.js'
      }
      this.setExtraByType('index',this.meslist.length);
      let message = {
        content: content,
        uploading: true,
        messageType: 'FileMessage',
        senderUserId: this.userId,
      }

      this.pushList(message);

      this.messageData.content = content;
      console.log(this.messageData.content);

      this.sendMessageFn('FileMessage');

    },

    finish(message) {
      let index = parseInt(this.getExtraByType(message.content.extra,'index'),10);
      this.meslist[index] = { ...message };
      let data = {
        uploading: false,
        ...message,
      };
      // this.meslist[index].upload = false;
      this.$set(this.meslist, index, data);
    },
    fileChange(ev, type) {
      let file = ev.srcElement.files[0];
      if (type === 'img') {
        
        if (file.size / 1024 > this.imgMaxSize) {
          this.$message(`图片大小必须小于${this.imgMaxSize}kb`);
          // 清除value  避免第二次不触发change
        }
        this.fileToImage(file);
        
      }else if(type === 'file'){
        if (file.size / 1024 > this.fileMaxSize) {
          this.$message(`文件大小必须小于${this.imgMaxSize}kb`);
          // 清除value  避免第二次不触发change
        }
        // 上传文件
        this.uploadFile(file);
      }
      ev.srcElement.value = '';
    },
    fileToImage(file) {
      let oThis = this;
      let reader = new FileReader();
      reader.readAsDataURL(file);// 读取图像文件 result 为 DataURL, DataURL 可直接 赋值给 img.src
      reader.onload = function (event) {
        // var img = document.getElementById("img").children[0];
        // img.src = event.target.result;//base64
        if((file.size / 1024)<100){
          // 小于100k 不用压缩
          oThis.uploadImg(event.target.result);
        }else{
          let image = new Image();
          let cw = 1;
          let ch = 1;
          image.src = event.target.result;
          image.onload = function () {
              //  300 300 
              if(image.width/image.height>1){
                // 宽大于高  宽度200压缩
                cw = 170;
                ch = (image.height*cw)/image.width;
              }else{
                ch = 170;
                cw = (image.width*ch)/image.height
              }
            let canvas = document.getElementById('canvas');
            canvas.width = cw;
            canvas.height = ch;
            let imageCanvas = canvas.getContext('2d');
            imageCanvas.drawImage(image, 0, 0, canvas.width, canvas.height);
            oThis.uploadImg(canvas.toDataURL('image/jpg'));
            
          };
        }
        
      };
    },
    
    upload(type) {
      if (type === 'img') {
        // 上传图片
        let oImgInput = document.querySelector('#picture');
        this.dispatch(oImgInput);
      } else if (type === 'file') {
        let oFileInput = document.querySelector('#file');
        this.dispatch(oFileInput);
      }
    },
    /*eslint-disable*/ 
    getExtraByType(extra,type){
      if(typeof(extra) !== 'object'){
        return JSON.parse(extra)[type];
      }else{
        return extra[type];
      }
    },
    setExtraByType(type,val){
      if(typeof(this.messageData.content.extra) !== 'object'){
        this.messageData.content.extra = JSON.parse(this.messageData.content.extra);
        
      }
      this.messageData.content.extra[type] = val;
    },
    
    emojiClickItem(item){
      this.mesData = this.mesData + item.symbol;
    },
    emojiClick(){
      // 初始化 emoji
      this.isShowEmoji = !this.isShowEmoji;
      if(this.emojiList.length>0){
        return;
      }
      this.emojiList = getemojiList();
    },
    

  }
}
</script>
<style scoped>

.emojibox{
    position: absolute;
    width: 100%;
    z-index: 111;
    background: #fff;
    bottom: 100px;
}
.emojibox div.item{
  display: inline-block;
}
.messagebox{
  position: absolute;
  bottom: 0;
  right: 0;
  background: #fff;
  width: 100%;
  height: 100%;
  box-shadow: 0 0 10px 0 #ccc;
  z-index: 9999;
}
.messagebox .headerbox{
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fb683c;
  color: #fff;
  padding: 0 15px;
}
.messagebox .headerbox .btns{
  font-size: 34px;
  display: flex;
  justify-content: space-between;
}
.messagebox .headerbox .btns span{
  width: 30px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  cursor: pointer;
}
.messagebox .sendbox{
  height: 100px;
  bottom: 0;
  right: 0;
  position: absolute;
  width: 100%;
  border-top:1px solid #ccc;
}
.messagebox .sendbox .inp{
  position: relative;
}
.messagebox .sendbox .btns{
  height: 30px;
  display: flex;
}
.messagebox .sendbox .btns span{
  display: block;
  font-size: 16px;
  width: 30px;
  text-align: center;
  cursor: pointer;
  line-height: 30px;
}
.messagebox .sendbox .btns span:hover{
  color: #fb683c;
}
.messagebox textarea{
  width: 100%;
  border: none;
  height: 70px;
  outline: none;
  box-sizing:border-box;
  padding: 0 15px 15px 15px;
  resize: none;
}
.messagebox .sub{
  position: absolute;
  width: 40px;
  height: 20px;
  line-height: 20px;
  color: #fff;
  text-align: center;
  font-size: 12px;
  background: #fb683c;
  color: #Fff;
  z-index: 9999;
  right: 10px;
  bottom: 10px;
  display: block;
  cursor: pointer;
  border-radius: 3px;
}
.messagebox .meslist{
  position: absolute;
  width: 100%;
  top: 40px;
  bottom:100px;
  overflow-y: auto;
  background: #f1f1f1;
}
.messagebox .meslist .item{
  max-width: 100%;
  display: flex;
  font-size: 14px;
  line-height: 20px;
  padding: 15px;
  position: relative;
}
.messagebox .meslist .item.on .imgbox{
  position: relative;
}
.messagebox .meslist .item.on .imgbox:after{
  content: "上传中...";
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 2;
  background: rgba(0,0,0,0.6);
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.messagebox .meslist .item.on .finish:after{
  display: none;
}
.messagebox .meslist .item.on .imgbox img{
  width: 100%;
  opacity: 1;
}
.messagebox .meslist .item .mes{
  display: inline-block;
  background: #fff;
  border: 1px solid #Ccc;
  padding: 5px 15px;
  border-radius: 3px;
  max-width: 60%;
}
.messagebox .meslist .item .mes.filebox{
  padding: 40px 20px 20px 20px;
  text-align: center;
  background: url('./img/file.png') no-repeat center 8px;
  background-size: 30px auto;
  cursor: pointer;
}
.messagebox .meslist .item.on{
  justify-content: flex-end;
}
.messagebox .meslist .item.on .mes{
  background-color: #fb683c;
  color: #fff;
  border-color: #fb683c;
}
</style>