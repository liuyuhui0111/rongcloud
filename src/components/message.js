import {
  fileUpload,
  getEquityTime,
  addVipNotice,
  getWorkTime,
  requestAuth,
  getWaitNum,
  endEvaluate,
  getExpertQuestion,
  expertEvaluate,
  getToken,
  getInQuestion,
  getIMById,
  clearUnreadMsgCount,
  send,
  groupSend,
} from '@/api/apis';
import {
  rongInit, getemojiList, emojiToHtml, sendMessage, initGroup,
} from './js/init';
import {
  formatDate,
} from '@/assets/utils/timefn';
import {
  validByPhone,
} from '@/assets/utils/validator';

export default {
  name: 'message',
  data() {
    return {
      name: 'message',
      tel: '40089098887', // 客服电话
      isShowPersonnNum: true, // 展示等待人数
      boolFalse: false,
      dialogRightVisible: false, // 无权益用户信息弹窗
      dialogCompentVisible: false, // 评分弹窗
      question: '', // 问题
      dialogQuestion: false, // 显示问题弹窗
      isNeedQuestion: true, // 是否需要填写问题
      mesData: '', // 发送信息
      meslist: [], // 消息列表
      emojiList: [],
      closeCofirmBox: false,
      hidemask: false, // 发送消息遮罩
      isShowMessageBox: false, // 显示聊天窗口
      isShowMessage: false, // 显示聊天窗口
      isShowSystemTips: false, // 显示系统提示
      isShowEmoji: false,
      imgMaxSize: 500, // 图片大小
      fileMaxSize: 10, // 文件大小 小于10m
      targetIdList: [], // 发送对象
      curid: '', // 咨询单id 接口用
      messageData: { // 消息对象
        content: {
          content: '',
          messageName: '',
          extra: {
            mesid: '',
            code: '',
            curid: '',
            icon: '',
            name: '',
          }, // 消息扩展信息，可以放置任意的数据内容。 用户信息  来源等
        },
      },
      getExpertQuestionParam: {
        question_desc: '',
      },

      userParam: { // 用户信息
        name: '',
        tel: '',
      },
      colors: ['#33C8DF', '#33C8DF', '#33C8DF'],
      rateParam: { // 评分信息
        rateVal: 5,
        rateTag: [0, 0, 0],
        rateMes: '', // 评价信息
      },


      getEquityCountRes: null, // 权益返回参数
      getWorkTimeRes: null,
      systemMessage: '', // 系统消息
      isCanUpLoad: true,
      timer: null,
      params: { // 初始化容联配置
        appkey: 'sfci50a7s3uzi',
        token: '',
        navi: '',
      },
      targetUser: [],
      userInfo: null,
      isCanUpLoadFile: true,
      groupId: '', // 群组id

      endTimer: null, // 结束咨询倒计时
      curUploadFileId: -1, // 存储当前正在上传的文件id 上传成功后动态修改对应消息记录
    };
  },
  created() {
  },
  async mounted() {
    //
    let params = {
      token: this.curUserData.token,
      // token: ,
    };
    if (!this.imtoken) {
      let res = await getToken(params);
      console.log(res);
      if (res.data.code === '0000') {
        let token = res.data.data.imToken;
        this.setImToken(token);
        let obj = JSON.parse(JSON.stringify(this.curUserData));
        obj.token = 'true';
        obj.id = res.data.data.username;
        obj.accountId = res.data.data.userId;
        obj.account = res.data.data.username;
        obj.name = res.data.data.nickname;
        obj.icon = res.data.data.headImg;
        this.setcurUserData({ ...res.data.data, ...obj });
        this.params.token = token;
      } else {
        this.$message(`${res.data.message}`);
        this.hideMessage(2000);
        return;
      }
    } else {
      this.params.token = this.imtoken;
    }
    this.checkCurUser();
  },
  methods: {
    async checkCurUser() {
      // 检测权益
      this.isShowMessageBox = true;
      this.isShowMessage = false;
      this.setmesListData([{}]);
      let gwtRes = await getWorkTime();

      if (gwtRes.data
          && gwtRes.data.code === '0000'
          && gwtRes.data.data
          && !gwtRes.data.data.isWorkTime) {
        this.getWorkTimeRes = gwtRes.data.data;
        // 不在工作时间 展示弹框
        let gwtCofirmRes = await this.confirmFn('2');
        if (gwtCofirmRes.code !== '0000') {
          // 不咨询了
          this.hideMessage();
          return;
        }
        // 提交问题
        // this.showMessage();
        this.dialogQuestion = true;
        return;
      }


      let curparams = {
        accountId: this.curUserData.accountId,
        account: this.curUserData.account,
      };
        // 获取当前用户权益
      let eqRes = await getEquityTime(curparams);
      if (eqRes.data.code === '0000') {
        this.getEquityCountRes = JSON.parse(JSON.stringify(eqRes.data.data));
        if (this.getEquityCountRes.status === 1) {
          // 有权益 弹出权益消耗弹框
          let eqDialogRes = await this.confirmFn('4');// 弹出权益使用弹窗
          if (eqDialogRes.code !== '0000') {
            // 取消
            this.hideMessage();
            return;
          }
        } else if (this.getEquityCountRes.status === 0) {
          // 权益消耗完 弹窗
          this.dialogRightVisible = true;
          return;
        }
      } else {
        this.$message('获取权益信息失败,请稍后再试');
        this.hideMessage(2000);
        return;
      }
      // this.dialogCompentVisible =true;

      // 获取是否有正在咨询的问题
      let giqRes = await getInQuestion({ accountId: this.curUserData.accountId });
      if (giqRes.data.code === '0000') {
        let { data } = giqRes.data;
        if (data.status === 1) {
          // 有正在咨询的问题
          if (data.online === 0) {
            this.setcurTargetUserData({ name: data.expertName, ...data });
            this.init();
          } else {
            // 专家不在线
            await this.confirmFn('6');
            this.hideMessage();
          }
        } else if (data.status === 0) {
          // 没有
          this.dialogQuestion = true;
        } else if (data.status === 2) {
          // 没有
          await this.confirmFn('6');

          this.hideMessage();


          // this.$message('已经提交过问题');
          // this.hideMessage(2000);
        }
      } else {
        this.dialogQuestion = true;
      }
    },
    async init() {
      console.log(this.curUserData, this.curTargetUserData);
      let personnNum = -1;
      let res = await getWaitNum({ expertId: this.curTargetUserData.expertId }); // 获取等待人数
      console.log(res);
      if (res.data.code === '0000') {
        personnNum = res.data.data.counts;
      }

      if (this.mesListData.length > 0
        && this.mesListData[0].id === this.curTargetUserData.id) {
        // 如果id 相等  证明还是上一次的咨询单  更新咨询单信息
        let obj = this.mesListData[0];
        obj.personnNum = personnNum;
        this.setmesListData([obj]);
        console.log(this.mesListData);
      } else {
      // 如果没有  获取历史聊天记录
        let imres = await getIMById({ id: this.curTargetUserData.id });
        let list = [];
        if (imres.data.code === '0000') {
          let arr = [];
          // 排除后台自定义消息  加入群组消息
          imres.data.data.msgList.forEach((item) => {
            if (item.objectName !== 'RC:DxhyMsg'
              && item.objectName !== 'RC:GrpNtf'
              && item.targetId
              && item.fromUserId) {
              arr.push(item);
            }
          });
          list = arr;
        }
        let obj = {
          code: this.curTargetUserData.code, // 咨询单code
          id: this.curTargetUserData.id, // 咨询单id
          target: { // 目标对象
            id: this.curTargetUserData.expertId, // 专家id
            name: this.curTargetUserData.name, // 专家名称
            account: this.curTargetUserData.expertAccount, // 专家账号
          },
          user: {
            id: this.curUserData.userId, // 当前用户id
            icon: this.curUserData.headImg, // 当前用户头像
            name: this.curUserData.username, // 当前用户名
          },
          list, // 聊天记录
          personnNum,
        };
        this.setmesListData([obj]);
      }


      this.messageData.content.extra = {
        mesid: this.mesListData[0].id,
        code: this.mesListData[0].code,
        curid: this.mesListData[0].id,
        icon: this.mesListData[0].user.icon,
        name: this.mesListData[0].user.name,
      };
      this.targetIdList = [this.mesListData[0].target.id];
      if (this.curTargetUserData.expertFromId) {
        // 如果有转单id  代表转单
        this.groupId = this.curTargetUserData.code;
        this.targetIdList = [this.mesListData[0].target.id,
          this.curTargetUserData.expertFromId];
      }
      // this.getHistoryMessageListFn();
      if (this.params.appkey && this.params.token) {
        rongInit(this.params, this.addPromptInfo);

        this.showMessage();
      } else {
        throw new Error('appkey 和 token 不能为空');
      }
    },


    async getExpertQuestionFn() {
      // 提交问题
      if (!this.getExpertQuestionParam.question_desc) {
        this.$message('请输入问题');
        return;
      }
      let params = {
        accountId: this.curUserData.accountId,
        account: this.curUserData.account,
        channelFrom: this.curUserData.channelFrom,
        fromName: this.curUserData.fromName,
        fromAddress: this.curUserData.fromAddress,
        fromContent: this.curUserData.fromContent,
        companyLocation: this.curUserData.companyLocation,
        distributorId: this.curUserData.distributorId,
        // distributorId: 0,
        companyTrade: this.curUserData.industry
        || (this.curUserData.currentSelect && this.curUserData.currentSelect.industry)
        || '',
        userCompany: (this.curUserData.currentSelect && this.curUserData.currentSelect.entName) || '',
        userType: this.curUserData.userType, //
        questionDesc: this.getExpertQuestionParam.question_desc,
      };
      console.log(params);
      let res = await getExpertQuestion(params);
      if (res.data.code === '0000') {
        // this.hideMessage();
        let { data } = res.data;
        if (data.status === 1) {
          // 获取成功
          this.setcurTargetUserData({ name: data.expertName, ...data });
          this.dialogQuestion = false;

          this.init();
        } else if (data.status === -1
          || data.status === 0) {
          // 专家不在线
          this.dialogQuestion = false;
          await this.confirmFn('6');
          this.hideMessage();
        }
      } else {
        this.$message(res.data.message);
      }
      console.log(res);
    },
    isShowTag(item) {
      // 显示那些tag
      return item.rate.indexOf(this.rateParam.rateVal) === -1;
    },
    startEndTime() {
      console.log('倒计时结束开启===20分钟');
      // 10分钟没清楚定时器就自动结束
      clearTimeout(this.endTimer);
      this.endTimer = setTimeout(() => {
        // let time = formatDate(new Date().getTime());
        // let message = `由于您长时间无消息本次咨询于${time} 结束`;
        // this.systemMessage = message;
        // this.sendMessageFn('InformationNotificationMessage');
        this.endEvaluateFn();
      }, 1000 * 60 * 20);
    },
    stopEndTime() {
      clearTimeout(this.endTimer);
    },
    async endEvaluateFn() {
      // 结束咨询
      let params = {
        id: this.curTargetUserData.id,
        endType: '1', // 结束类型1用户结束2系统结束
      };
      let res = await endEvaluate(params);
      if (res.data.code === '0000') {
        // 结束咨询
        this.closeCofirmBox = false;
        this.endEvaluateFnSuc();
      } else {
        this.$message(res.data.message);
      }
    },
    endEvaluateFnSuc() {
      this.hidemask = true;
      this.dialogCompentVisible = true;
    },
    resetData() {
      // 初始化data数据
      this.setmesListData([{}]);
      this.mesData = '';
      this.rateParam = { // 评分信息
        rateVal: 5,
        rateTag: [0, 0, 0],
        rateMes: '', // 评价信息
      };
      this.getExpertQuestionParam = {
        question_desc: '',
      };
    },
    again() {
      this.resetData();
      this.hidemask = false;
      this.isShowMessage = false;
      this.checkCurUser();
    },
    getWaitNumFn() {
      return getWaitNum(); // 获取等待人数
    },

    async dialogCompentVisibleSub() {
      // 提交评价
      let flag = false;
      let ids = [];
      this.rateTagMap.forEach((item) => {
        if (item.active) {
          ids.push(item.id);
          flag = true;
        }
      });
      if (!flag && !this.rateParam.rateMes && this.rateParam.rateVal < 5) {
        this.$message('请选择标签或评论专家的服务');
        return;
      }
      // if (!this.rateParam.rateMes && this.rateParam.rateVal < 5) {
      //   this.$message('请选择标签或评论专家的服务');
      //   return;
      // }

      let params = {
        account: this.curUserData.id,
        evaluateContent: this.rateParam.rateMes,
        evaluateFlag: ids.join(','),
        evaluateScore: this.rateParam.rateVal,
        expertName: this.curTargetUserData.name,
        expertAccount: this.curTargetUserData.expertAccount,
        distributorId: this.curUserData.distributorId,
        questionId: this.curTargetUserData.id,
      };

      let res = await expertEvaluate(params);
      if (res.data.code === '0000') {
        this.$message('提交评价成功');
        this.dialogCompentVisible = false;
        // this.hideMessage(2000);
      } else {
        this.$message(res.data.message);
      }
    },
    async requestAuthFn() {
      // 点击用户授权图标
      let res = await this.confirmFn('3');
      if (res.code === '0000') {
        // 确认授权
        let params = {
          accountId: this.curUserData.accountId,
          expertId: this.curTargetUserData.expertAccount,
          authType: 0,
        };
        let raRes = await requestAuth(params);
        if (raRes.data.code !== '0000') {
          this.$message('授权失败，请重新授权');
        }
      }
    },
    async addVipNoticeFn() {
      // 添加会员
      if (!this.userParam.name) {
        this.$message('请输入用户名');
        return;
      }
      if (!this.userParam.tel) {
        this.$message('请输入手机号');
        return;
      }

      if (!validByPhone(this.userParam.tel)) {
        this.$message('手机号格式有误');
        return;
      }

      let params = {
        accountId: this.curUserData.accountId,
        name: this.userParam.name,
        phone: this.userParam.tel,
        distributorId: this.curUserData.distributorId,
        productId: this.curUserData.productId,

      };
      let res = await addVipNotice(params);
      if (res.data.code === '0000') {
        this.dialogRightVisible = false;
        this.$message('提交成功');
        this.hideMessage(2000);
      } else {
        this.$message(res.data.message);
      }
    },
    fileUploadFn(params) {
      return fileUpload(params);
    },
    tagClick(item) {
      /*eslint-disable*/ 
      item.active = !item.active;
       /* eslint-enable */
    },
    sleep(time) {
      // 延迟几秒执行
      /*eslint-disable*/ 
      return new Promise((resolve)=>{
        setTimeout(()=>{
          resolve();
        },time)
      });
      /* eslint-enable */
    },
    async showMessage(time) {
      if (time) await this.sleep(time);
      this.isShowMessageBox = true;
      this.isShowMessage = true;
      this.$emit('show');
      this.sendMessageToParent({ code: '200', data: 'show' });
    },
    async hideMessage(time) {
      // 隐藏聊天框
      // 清除未读消息
      clearUnreadMsgCount({ userId: this.userId, questionId: this.curTargetUserData.id });
      // if(this.dialogRightVisible){
      //   // 校验userParam
      //   if(this.userParam.name || this.userParam.tel){
      //     // 如果填写了信息
      //     let res = await this.$$confirm('您还没有提交信息，确定关闭吗？');
      //     if(res.code === '0000'){
      //       this.dialogRightVisible = false;
      //       this.hideMessageFn();
      //     }
      // return;
      //   }
      // }

      // if(this.dialogCompentVisible){
      //   // 校验userParam
      //     // 如果填写了信息
      //     let res = await this.$$confirm('您还没有提交评价信息，确定关闭吗？');
      //     if(res.code === '0000'){
      //       this.dialogCompentVisible = false;
      //       this.hideMessageFn();
      //     }
      //   return;
      // }


      if (this.dialogQuestion) {
        // 校验userParam
        if (this.getExpertQuestionParam.question_desc) {
          // 如果填写了信息
          let res = await this.$$confirm('您已经填写了要咨询的问题，确定关闭吗？');
          if (res.code === '0000') {
            this.dialogQuestion = false;
            this.hideMessageFn();
          }
          return;
        }
      }

      this.hideMessageFn(time);
    },
    async hideMessageFn(time) {
      if (time) {
        await this.sleep(time);
      }
      this.isShowMessageBox = false;
      this.isShowMessage = false;
      this.setcurUserData({});
      this.$emit('hide');
      this.sendMessageToParent({ code: '200', data: 'hide' });
    },
    async startSendMes() {
      if (!this.mesData) {
        this.$message({ message: '请输入聊天内容', type: 'warning' });
        return;
      }
      this.messageData.content.content = this.mesData;
      this.sendMessageFn('TextMessage');
    },
    sendQuestion(content) {
      if (this.hidemask) return;
      this.messageData.content.content = content;
      let params = {
        fromUserId: this.userId,
        objectName: 'RC:TxtMsg',
        content: JSON.stringify(this.messageData.content),
      };
      /*eslint-disable*/ 
      if (this.groupId) {
        params.toGroupId = this.groupId;
        groupSend(params);
      } else {
        params.toUserId = this.targetIdList[0];
        send(params);
      }
      /* eslint-enable */
      // this.sendMessageFn('TextMessage');
      // this.stopEndTime();
    },

    async initGroupFn(chatRoomId, type) {
      // 初始化群组

      // let c = await this.confirmFn('5');
      // this.dialogCompentVisible = true;

      this.messageData.content = {
        type: '0001',
        data: {
          id: 1,

        },
        extra: this.messageData.content.extra,
      };
      this.sendMessageFn('OptionsMessage', true);
      let res = await initGroup(chatRoomId, type);
      console.log(res);
    },
    checkMesForSystem() {
      if (this.mesListData[0].list.length < 1) {
        // 没有聊天数据
        return true;
      }
      let min = 5 * 60 * 1000; // 发送系统时间  时间间隔 分钟
      let { list } = this.mesListData[0];
      let lastTime = list[list.length - 1].sentTime + min;
      let curTime = new Date().getTime();
      if (lastTime < curTime) {
        // 最后一条消息的时间  大于 5分钟
        return true;
      }

      return false;
    },
    sendSystemMessage() {
      if (this.checkMesForSystem()) {
        // 需要发送
        // 暂存messageData 数据
        let oMessageData = JSON.parse(JSON.stringify(this.messageData));
        console.log(oMessageData);
        // 系统类通知消息
        let sysObj = {
          content: {
            message: '',
            extra: oMessageData.content.extra,
            messageName: 'InformationNotificationMessage',
          },
        };
        // this.messageData.content = {
        //   message:'',
        //   extra:this.messageData.content.extra,
        //   messageName:'InformationNotificationMessage',
        // };
        return sendMessage(this.targetIdList, sysObj, false, this.groupId);
      }
      return new Promise((resolve) => {
        resolve({ code: '404' });
      });
    },
    async sendMessageFn(messageName, isCreate) {
      // 发送消息
      if (!messageName) {
        // 如果没有消息类型 返回
        return false;
      }
      // 发送系统消息
      if (messageName !== 'InformationNotificationMessage'
        && messageName === 'TextMessage') {
        // 判断最后一条信息是什么 是否需要发送系统消息
        let sysRes = await this.sendSystemMessage();
        if (sysRes.code === '0000') {
          this.sendMesResult(sysRes);
        }
      }

      if (messageName === 'InformationNotificationMessage') {
        // 系统类通知消息
        this.messageData.content = {
          message: this.systemMessage,
          extra: this.messageData.content.extra,
        };
      }
      // if (messageName === 'TextMessage') {
      //   // 文本消息

      //   this.messageData.content.content = this.mesData;
      // }
      this.messageData.content.messageName = messageName;

      let res = await sendMessage(this.targetIdList, this.messageData, isCreate, this.groupId);
      this.sendMesResult(res);
      return new Promise((resolve) => {
        resolve(res);
      });
    },
    sendMesResult(res) {
      console.log('发送消息成功', res);
      if (res.code === '0000') {
        // 发送成功
        if (res.message.content.messageName === 'TextMessage') {
          this.mesData = '';
          this.pushList(res.message);
        } else if (res.message.content.messageName === 'ImageMessage'
          || res.message.content.messageName === 'FileMessage') {
          this.pushList(res.message, 'edit');
        } else {
          this.pushList(res.message);
          // this.finish(res.message);
        }
      }
    },
    pushList(data, type) {
      if (type === 'edit') {
        this.fileUpLoadSuc(data);
      } else {
        let obj = this.mesListData[0];
        obj.list.push({
          id: obj.list.length,
          ...data,
        });
        if (data.objectName === 'RC:InfoNtf'
        && data.content.extra
        && data.content.extra.contentType === 'MSG_END') {
        // 是系统消息  结束咨询
          this.endEvaluateFnSuc();
        }
        this.setmesListData([obj]);
        this.$forceUpdate();
        this.scrollEnd();
      }
    },
    fileUpLoadSuc(data, type) {
      let list = this.mesListData[0].list.slice();
      let i = -1;
      list.forEach((item, index) => {
        if (item.id === this.curUploadFileId) {
          i = index;
        }
      });
      if (i !== -1) {
        /*eslint-disable*/ 
        data.uploading = false;
        /* eslint-enable */
        if (type === 'del') {
          // 上传失败删除消息记录
          list.splice(i, 1);
        } else {
          // 上传成功 修改消息状态
          list[i] = data;
        }
        this.mesListData[0].list = list;
        this.setmesListData(this.mesListData);
        this.$forceUpdate();
      }
      this.isCanUpLoadFile = true;
    },
    emojiToHtml(mes) {
      if (typeof (mes) === 'string') {
        return emojiToHtml(mes);
      }
      return '消息格式非法';
    },
    scrollTop() {
      this.$nextTick(() => {
        // 滚动到底部
        let ele = document.getElementById('meslist');
        let aItems = ele.querySelectorAll('.item');
        let oItem = aItems[aItems.length - 20];
        if (!ele || !oItem) {
          return;
        }
        oItem.scrollIntoView();
      });
    },
    scrollEnd() {
      // 滚动到底部
      this.$nextTick(() => {
        // 滚动到底部
        let ele = document.getElementById('meslist');
        if (!ele) return;
        ele.scrollTop = ele.scrollHeight;
      });
    },
    hidepersonnNum() {
      this.mesListData[0].personnNum = -1;
      console.log('hidepersonnNum');
      this.$forceUpdate();
    },
    addPromptInfo(res) {
      // let oThis = this;
      if (res.code === '9999') {
        console.log('收到消息', res);
        // 隐藏等待人数消息

        // 判断咨询单id  与当前咨询单id是否一致  不一致不做处理  可能是离线留言
        if (res.data.content.extra
          && (window.vue.curTargetUserData.id !== res.data.content.extra.mesid)) {
          console.log('非当前咨询单消息，不做处理', window.vue.curTargetUserData.id, res.data.content.extra.mesid);
          return;
        }
        this.hidepersonnNum();

        // 收到消息
        if (res.data.objectName === 'RC:DxhyMsg') {
          // 后台自定义消息
          console.log('收到后台自定义消息', res);
          if (res.data.content.contentType === 'MSG_END_REQUEST') {
            this.pushList(res.data);
            // this.startEndTime();
          }
        } else if (res.data.messageType === 'GroupNotificationMessage') {
          // 加入群组消息  转单
          this.curTargetUserData.name = res.data.content.data.toExpertName; // 转单专家name
          this.setcurTargetUserData(this.curTargetUserData);
          this.groupId = res.data.content.data.targetGroupName; // 群组id

          let tagetid = res.data.content.data.operatorNickname; // 被转专家id
          let changeid = res.data.senderUserId; // 转单专家id
          this.targetIdList = [tagetid, changeid];

          console.log('转单 加入群组消息', res.data, this.groupId, this.targetIdList);
        } else {
          this.pushList(res.data);
        }
      } else if (res.code === '0000') {
        console.log('拿到userid', res);
        // 拿到userid
        this.setUserId(res.data);
        // 获取聊天记录
        // this.getHistoryMessageListFn();
      } else if (res.code === '-9999') {
        // 断开连接
        console.log('断开连接');
        this.hideMessage();
      } else if (res.code === '1001') {
        this.$message(res.message);
      } else if (res.code === '1002') {
        this.$message(res.message);
        this.hideMessage(2000);
      }
    },
    sendMessageToParent(data) {
      // 传递信息给父页面
      window.parent.postMessage(data, '*');
    },

    imgClick(item) {
      console.log(item, '点击图片消息');
      if (item.content.messageName === 'ImageMessage') {
        window.open(item.content.imageUri, '_blank');
      } else {
        window.open(item.content.fileUrl, '_blank');
      }
    },

    async uploadImg(content, fparams) {
      // 上传图片 content base64
      let res = await this.sendSystemMessage();
      if (res.code === '0000') {
        this.sendMesResult(res);
      }
      this.curUploadFileId = this.mesListData[0].list.length;
      let obj = {
        content: {
          messageName: 'ImageMessage',
          content,
          imageUri: '',
        },
        uploading: true,
        messageType: 'ImageMessage',
        objectName: 'RC:ImgMsg',
        senderUserId: this.userId,
      };

      this.pushList(obj);


      let fileRes = await this.fileUploadFn(fparams);
      if (fileRes.data.code === '0000') {
        this.messageData.content.imageUri = fileRes.data.data;
      } else {
        this.$message(fileRes.data.message);
        this.fileUpLoadSuc(null, 'del');
        return;
      }

      // 上传成功 删除预览消息
      // this.mesListData[0].list.splice(curindex, 1);
      // this.isCanUpLoadFile = true;


      // 发送图片消息
      this.messageData.content.content = content;
      this.sendMessageFn('ImageMessage');
    },
    async uploadFile(file) {
      if (!file) return;
      let res = await this.sendSystemMessage();
      if (res.code === '0000') {
        this.sendMesResult(res);
      }
      this.curUploadFileId = this.mesListData[0].list.length;
      let content = {
        name: file.name,
        size: file.size,
        type: file.type,
        extra: this.messageData.content.extra,
        messageType: 'FileMessage',
        objectName: 'RC:FileMsg',
        fileUrl: '',
      };

      let message = {
        content,
        uploading: true,
        messageType: 'FileMessage',
        objectName: 'RC:FileMsg',
        senderUserId: this.userId,
      };

      this.pushList(message);

      let reader = new FileReader();
      reader.readAsDataURL(file);// 读取图像文件 result 为 DataURL, DataURL 可直接 赋值给 img.src
      reader.onload = async (event) => {
        let filesrc = event.target.result.substr(event.target.result.indexOf('base64,') + 7);
        let fparams = {
          file: filesrc,
          originalName: file.name,
          contentType: file.type,
        };
        let fileRes = await this.fileUploadFn(fparams);
        if (fileRes.data.code === '0000') {
          content.fileUrl = fileRes.data.data;
        } else {
          this.$message(fileRes.data.message);
          this.fileUpLoadSuc(null, 'del');
          return;
        }


        this.messageData.content = content;
        this.sendMessageFn('FileMessage');
      };
    },
    fileChange(ev, type) {
      let postFiles = Array.prototype.slice.call(ev.target.files);
      let file = postFiles[0];
      if (type === 'img') {
        if (file.size / 1024 > this.imgMaxSize) {
          this.$message(`图片大小必须小于${this.imgMaxSize}kb`);
          // 清除value  避免第二次不触发change
          return;
        }
        this.fileToImage(file);
      } else if (type === 'file') {
        if (file.size / (1024 * 1024) > this.fileMaxSize) {
          this.$message(`文件大小必须小于${this.fileMaxSize}M`);
          return;
          // 清除value  避免第二次不触发change
        }
        this.isCanUpLoadFile = false;
        // 上传文件
        this.uploadFile(file);
      }
      /*eslint-disable*/ 
      ev.target.value = '';
       /* eslint-enable */
    },
    async fileToImage(file) {
      let oThis = this;
      let reader = new FileReader();
      reader.readAsDataURL(file);// 读取图像文件 result 为 DataURL, DataURL 可直接 赋值给 img.src
      reader.onload = (event) => {
        // var img = document.getElementById("img").children[0];
        // img.src = event.target.result;//base64
        let filesrc = event.target.result.substr(event.target.result.indexOf('base64,') + 7);
        let fparams = {
          file: filesrc,
          originalName: file.name,
          contentType: file.type,
        };
        if ((file.size / 1024) < 100) {
          // 小于100k 不用压缩
          oThis.uploadImg(event.target.result, fparams);
        } else {
          let image = new Image();
          let cw = 1;
          let ch = 1;
          image.src = event.target.result;
          image.onload = () => {
            //  300 300
            if (image.width / image.height > 1) {
              // 宽大于高  宽度200压缩
              cw = 170;
              ch = (image.height * cw) / image.width;
            } else {
              ch = 170;
              cw = (image.width * ch) / image.height;
            }
            let canvas = document.getElementById('canvas');
            canvas.width = cw;
            canvas.height = ch;
            let imageCanvas = canvas.getContext('2d');
            imageCanvas.drawImage(image, 0, 0, canvas.width, canvas.height);
            oThis.uploadImg(canvas.toDataURL('image/jpg'), fparams);
          };
        }
      };
    },

    upload(type) {
      if (!this.isCanUpLoadFile) {
        this.$message('有文件正在上传中...');
        return;
      }
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


    getSystemTip(item){
      if(item.content.message){
        return item.content.message;
      }else{
        let curtime = formatDate(new Date().getTime());
        let sentTime = item.sentTime || item.msgTimestamp
        let time = formatDate(sentTime);
        if(time.split(' ')[0] === curtime.split(' ')[0]){
          return time.split(' ')[1];
        }else{
          return time;
        }
      }
    },

    confirm(message,subtext,canceltext,title,hideCancelBtn){
      // 
      if(!message) return;
      let showCancelButton = !hideCancelBtn;  //隐藏btn按钮
      return new Promise((resolve)=>{
        this.$confirm(message, title || '', {
          confirmButtonText: subtext || '确定',
          cancelButtonText: canceltext || '取消',
          showCancelButton,
          closeOnClickModal:false,
        }).then(() => {
          resolve({code:'0000'})
        }).catch(() => {
          resolve({code:'404'})         
        });

      })
    },
    confirmFn(type){
      let message = '';
      const h = this.$createElement;
      if(type === '1'){
        // 弹出问题咨询弹窗
        message = '您已经填写了要咨询的问题，确定关闭吗？';
        return this.confirm(message);
      }else if (type === '2'){
        // 非工作时间提醒
        // let time = '（工作时间：8：00--21:00）'
        let time = this.getWorkTimeRes.desc;
        message = h('div',{
          class:'common-dialog-mes',
          key:'dialog-type'+type,
          ref:'dialog-type'+type,
          },[
            h('p',null,'现在是非工作时间，您可以先提交要咨询的问题'),
            h('p',null,'专家上班会尽快给你回复'),
            h('p',null,time),
          ]);
        return this.confirm(message,'提交问题','不咨询了');
      }else if (type === '3'){
        // 授权提示信息
        message = h('div',{
          class:'common-dialog-mes',
          key:'dialog-type'+type,
          ref:'dialog-type'+type,
          },[
            h('p',{
              style:{
                fontWeight:'blod',
                fontSize:'18px'
              }
            },'数据授权'),
            h('p',null,'为了更好的解答您的问题，专家获取以下权限：'),
            h('p',{
              class:'icon-auth'
            },'授权专家在咨询期间查看您的风险测评数据及报告'),
            h('p',null,'咨询结束后查看权限将被收回'),
          ]);
        return this.confirm(message,'允许','拒绝');
      }else if (type === '4'){
        // 权益咨询次数提示信息
        let allnum = 0;
        let curnum = 0;
        let usenum = 1;   //使用
        if(this.getEquityCountRes){
          allnum = this.getEquityCountRes.equityDay;   //总数
          usenum = this.getEquityCountRes.betweenDays;   //剩余
        }

         message = h('div',{
          class:'common-dialog-mes',
          key:'dialog-type'+type,
          ref:'dialog-type'+type,
          },[
            h('p',null,[
              '您拥有',
              h('span',{
                style:{
                  color:'#33C8DF',
                }
              },allnum),
              '天免费咨询权益',
              ]),
            h('p',['现剩余',
               h('span',{
                style:{
                  color:'#33C8DF',
                  fontSize:'1.4em'
                }
              },usenum),
              '天']),
          ]);
        return this.confirm(message);
      }else if (type === '5'){
        // 权益咨询天数提示信息
        let num = 2;  //剩余天数
        message = h('div',{
          class:'common-dialog-mes',
          key:'dialog-type'+type,
          ref:'dialog-type'+type,
          },[
            h('p',null,'您拥有5天免费咨询权益'),
            h('p',['现剩余 ',
               h('span',{
                style:{
                  color:'#33C8DF',
                  fontSize:'1.4em'
                }
              },num),
              ' 天']),
          ]);
        return this.confirm(message,'立即咨询','','',true);
      }else if (type === '6'){
        // 非工作时间提醒
        // let time = '（工作时间：8：00--21:00）'
        // let time = this.getWorkTimeRes.desc;
        message = h('div',{
          class:'common-dialog-mes',
          key:'dialog-type'+type,
          ref:'dialog-type'+type,
          },[
            h('p',null,'现在无值班专家在线，请稍后再试'),
            h('p',null,'专家上线会尽快给你回复'),
          ]);
        return this.confirm(message,'确定','','',true);
      }
    },
    

  }
}