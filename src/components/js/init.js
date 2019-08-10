/*eslint-disable*/ 
// 消息类型页面 https://www.rongcloud.cn/docs/message_architecture.html#message_content

let { RongIMLib } = window;
let { Protobuf } = window;
let { RongIMClient } = window.RongIMLib;
export function sendMessage(targetIdList,messageData) {
  // 发送消息  参数 目标列表 消息对象 content messageName 必须传
  // messageData：{content:{messageName:''}}
  if(targetIdList.length<1 || !messageData){
    // 没有传发送对象  和消息内容
    new Error('params error ')
    return;
  }
  if(!(messageData.content && messageData.content.messageName)){
    new Error('params error content.messageName不可为空');
    return;
  }
  let RongIMLib = window.RongIMLib;
  let RongIMClient = window.RongIMLib.RongIMClient;
  let conversationType = RongIMLib.ConversationType.PRIVATE; 

  if(!(RongIMClient && RongIMClient._instance)){
    resolve({code:'-9999',message:'没有初始化'});
    new Error('RongIMLib 没有初始化');
    return;
  }

  let targetId = targetIdList.length === 1 ? targetIdList[0] : targetIdList;
  if(typeof(messageData.content.extra) === 'object'){
    messageData.content.extra = JSON.stringify(messageData.content.extra);
  }
  let mestype = messageData.content.messageName;
  let msg = new RongIMLib[mestype](messageData.content);

  return new Promise((resolve)=>{
    // 返回发送结果
     RongIMClient.getInstance().sendMessage(
      conversationType, 
      targetId, 
      msg, 
      {
        onSuccess: function (message) {
          // message 为发送的消息对象并且包含服务器返回的消息唯一 id 和发送消息时间戳
          resolve({code:'0000',message});
        },
        onError: function (errorCode) {
          resolve({code:'-9999',message:errorCode});
          console.log('发送文本消息失败', errorCode);
        }
      });
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


function initEmoji(){
  let RongIMLib = window.RongIMLib;
   // 直接初始化
  RongIMLib.RongIMEmoji.init();

  // 通过配置初始化
  // 表情信息可参考 http://unicode.org/emoji/charts/full-emoji-list.html
  var config = {
      size: 24, // 大小, 默认 24, 建议15 - 55
  };
  RongIMLib.RongIMEmoji.init(config);
}

export function getemojiList(){
  // 获取emoji list
  let RongIMEmoji = window.RongIMLib.RongIMEmoji;
  return RongIMEmoji.list;
}

export function emojiToHtml(message){
  // emoji 转html
  let RongIMEmoji = window.RongIMLib.RongIMEmoji;
  return RongIMEmoji.symbolToHTML(message);
}
