// 消息类型页面 https://www.rongcloud.cn/docs/message_architecture.html#message_content

function initEmoji() {
  let { RongIMLib } = window;
  // 直接初始化
  RongIMLib.RongIMEmoji.init();

  // 通过配置初始化
  // 表情信息可参考 http://unicode.org/emoji/charts/full-emoji-list.html
  let config = {
    size: 24, // 大小, 默认 24, 建议15 - 55
  };
  RongIMLib.RongIMEmoji.init(config);
}

export function sendMessage(targetIdList, messageData) {
  // 发送消息  参数 目标列表 消息对象 content messageName 必须传
  // messageData：{content:{messageName:''}}
  return new Promise((resolve, reject) => {
    if (targetIdList.length < 1 || !messageData) {
    // 没有传发送对象  和消息内容
      reject(new Error('params error '));
      return;
    }
    if (!(messageData.content && messageData.content.messageName)) {
      reject(new Error('params error '));
      return;
    }
    let { RongIMLib } = window;
    let { RongIMClient } = window.RongIMLib;

    let conversationType = RongIMLib.ConversationType.PRIVATE;
    /* 会话类型 PRIVATE  单聊
    GROUP 群组
    CHATROOM 聊天室
    CUSTOMER_SERVICE   客服
    等等https://www.rongcloud.cn/docs/web.html#conversation
  */
    /*eslint-disable*/ 
    if (!(RongIMClient && RongIMClient._instance)) {
      reject(new Error(' error 没有初始化'));
      return;
    }
    
    let targetId = targetIdList.length === 1 ? targetIdList[0] : targetIdList;
    if (typeof (messageData.content.extra) === 'object') {
      let extra = JSON.stringify(messageData.content.extra);
      messageData.content.extra = extra;
    }
    /* eslint-enable */
    let mestype = messageData.content.messageName;
    /* 消息类型
  TextMessage         文字消息
  ImageMessage        图片消息
  FileMessage         文件消息
  InformationNotificationMessage      提示条通知消息
  ContactNotificationMessage         好友通知消息
  GroupNotificationMessage         群组通知消息
  CommandMessage         命令消息
  等等https://www.rongcloud.cn/docs/message_architecture.html#message_content
  */
    let msg = new RongIMLib[mestype](messageData.content);


    // 返回发送结果
    RongIMClient.getInstance().sendMessage(
      conversationType,
      targetId,
      msg,
      {
        onSuccess(message) {
          // message 为发送的消息对象并且包含服务器返回的消息唯一 id 和发送消息时间戳
          resolve({ code: '0000', message });
        },
        onError(errorCode) {
          resolve({ code: '-9999', message: errorCode });
          console.log('发送文本消息失败', errorCode);
        },
      },
    );
  });
}

export function rongInit(params, addPromptInfo) {
  // 容联初始化
  let { RongIMLib } = window;
  let { Protobuf } = window;
  let { RongIMClient } = window.RongIMLib;
  let { appkey } = params;
  let { token } = params;
  let { navi } = params;
  let config = {
    protobuf: Protobuf,
  };
  if (navi) {
    config.navi = navi;
  }
  // 初始化emoji
  initEmoji();
  RongIMClient.init(appkey, null, config);
  RongIMClient.setConnectionStatusListener({
    onChanged(status) {
      addPromptInfo({ code: status, message: '' });
      switch (status) {
        case RongIMLib.ConnectionStatus.CONNECTED:
        case 0:
          console.log('连接成功');

          break;

        case RongIMLib.ConnectionStatus.CONNECTING:
        case 1:
          console.log('连接中');
          addPromptInfo({ code: status, message: '' });
          break;

        case RongIMLib.ConnectionStatus.DISCONNECTED:
        case 2:
          console.log('当前用户主动断开链接');
          addPromptInfo({ code: status, message: '' });
          break;

        case RongIMLib.ConnectionStatus.NETWORK_UNAVAILABLE:
        case 3:
          console.log('网络不可用');
          addPromptInfo({ code: status, message: '' });
          break;

        case RongIMLib.ConnectionStatus.CONNECTION_CLOSED:
        case 4:
          console.log('未知原因，连接关闭');
          addPromptInfo({ code: status, message: '' });
          break;

        case RongIMLib.ConnectionStatus.KICKED_OFFLINE_BY_OTHER_CLIENT:
        case 6:
          console.log('用户账户在其他设备登录，本机会被踢掉线');
          addPromptInfo({ code: status, message: '' });
          break;

        case RongIMLib.ConnectionStatus.DOMAIN_INCORRECT:
        case 12:
          console.log('当前运行域名错误，请检查安全域名配置');
          addPromptInfo({ code: status, message: '' });
          break;
        default:
          console.log('服务器返回错误');
          addPromptInfo({ code: status, message: '' });
      }
    },
  });


  RongIMClient.setOnReceiveMessageListener({
    // 接收到的消息
    onReceived(message) {
      console.log('接收消息');
      addPromptInfo({ code: '9999', data: message });
    },
  });
  RongIMClient.connect(token, {
    onSuccess(userId) {
      addPromptInfo({ code: '0000', data: userId });
    },
    onTokenIncorrect() {
      addPromptInfo({ code: '0002', data: 'token无效' });
    },
    onError(errorCode) {
      addPromptInfo(errorCode);
    },
  }, null);
}


export function getemojiList() {
  // 获取emoji list
  let { RongIMEmoji } = window.RongIMLib;
  return RongIMEmoji.list;
}

export function emojiToHtml(message) {
  // emoji 转html
  let { RongIMEmoji } = window.RongIMLib;
  return RongIMEmoji.symbolToHTML(message);
}


// 加入群组
export function initGroup(chatRoomId, type) {
  let { RongIMClient } = window.RongIMLib;
  // let chatRoomId = chatRoomId; // 聊天室 Id
  let count = 50; // 拉取最近聊天最多 50 条
  return new Promise((resolve) => {
    if (type === 'quit') {
      // 退出群组
      RongIMClient.getInstance().quitChatRoom(chatRoomId, {
        onSuccess() {
          // 退出聊天室成功
          console.log('退出聊天室成功');
          resolve({ code: '0000' });
        },
        onError(error) {
          // 退出聊天室失败
          console.log('退出聊天室失败', error);
          resolve({ code: '404' });
        },
      });
    } else {
      RongIMClient.getInstance().joinChatRoom(chatRoomId, count, {
        onSuccess() {
          // 加入聊天室成功
          console.log('加入聊天室成功');
          resolve({ code: '0000' });
        },
        onError(error) {
          // 加入聊天室失败
          console.log('加入聊天室失败', error);
          resolve({ code: '404' });
        },
      });
    }
  });
}
