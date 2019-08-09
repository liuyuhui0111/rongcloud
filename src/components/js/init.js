let RongIMLib = window.RongIMLib;
let Protobuf = window.Protobuf;
let RongIMClient = window.RongIMLib.RongIMClient;
export function getmsg(RongIMLib,type) {
	// body...
}

export function rongInit(params,addPromptInfo){
    // 容联初始化
      let RongIMLib = window.RongIMLib;
      let Protobuf = window.Protobuf;
      let RongIMClient = window.RongIMLib.RongIMClient;
      let { appkey } = params;
      let { token } = params;
      let { navi } = params;
      let oThis = this;
      let config = {
        protobuf: Protobuf,
      };
      if (navi) {
        config.navi = navi;
      }
      if(RongIMClient && RongIMClient._instance){
        this.isShowMessageBox = true;
      }
      // 初始化emoji
      this.initEmoji();

      RongIMClient.init(appkey, null, config);
      RongIMClient.setConnectionStatusListener({
        onChanged(status) {
          switch (status) {
            case RongIMLib.ConnectionStatus.CONNECTED:
            case 0:
              console.log('连接成功');
              addPromptInfo({code:'0000',message:'连接成功'})
              break;

            case RongIMLib.ConnectionStatus.CONNECTING:
            case 1:
              console.log('连接中');
              addPromptInfo({code:status,message:''});
              break;

            case RongIMLib.ConnectionStatus.DISCONNECTED:
            case 2:
              console.log('当前用户主动断开链接');
              addPromptInfo({code:status,message:''});
              break;

            case RongIMLib.ConnectionStatus.NETWORK_UNAVAILABLE:
            case 3:
              console.log('网络不可用');
              addPromptInfo({code:status,message:''});
              break;

            case RongIMLib.ConnectionStatus.CONNECTION_CLOSED:
            case 4:
              console.log('未知原因，连接关闭');
              addPromptInfo({code:status,message:''});
              break;

            case RongIMLib.ConnectionStatus.KICKED_OFFLINE_BY_OTHER_CLIENT:
            case 6:
              console.log('用户账户在其他设备登录，本机会被踢掉线');
              addPromptInfo({code:status,message:''});
              break;

            case RongIMLib.ConnectionStatus.DOMAIN_INCORRECT:
            case 12:
              console.log('当前运行域名错误，请检查安全域名配置');
              addPromptInfo({code:status,message:''});
              break;
            default:
              console.log('服务器返回错误');
              addPromptInfo({code:status,message:''});
          }
        },
      });


      RongIMClient.setOnReceiveMessageListener({
        // 接收到的消息
        onReceived(message) {
          console.log('接收消息');
          addPromptInfo({code:'9999',data:message});
        },
      });
      RongIMClient.connect(token, {
        onSuccess(userId) {
          oThis.isShowMessageBox =true;
          oThis.userId = userId;
          addPromptInfo({code:'9998',data:userId});
        },
        onTokenIncorrect() {
          addPromptInfo({code:'0002',data:'token无效'});
        },
        onError(errorCode) {
          addPromptInfo(errorCode);
        },
      }, null);

    }