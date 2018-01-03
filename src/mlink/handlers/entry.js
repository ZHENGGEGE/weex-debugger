const mlink = require('../midware/index');
const Router = mlink.Router;
const simulatorManager = require('../lib/simulator_manager');
const config = require('../../lib/config');
const hook = require('../../util/hook');
const debuggerRouter = Router.get('debugger');

debuggerRouter.registerHandler((message) => {
  if (message.payload.method === 'WxDebug.applyChannelId') {
    const channelId = debuggerRouter.newChannel();
    message.payload = {
      method: 'WxDebug.pushChannelId',
      params: {
        channelId,
        connectUrl: config.getConnectUrl(channelId)
      }
    };
    message.reply();
  }
  else if (message.payload.method === 'WxDebug.simrun') {
    simulatorManager.connect(message.payload.params).catch((e) => {
      hook.record('/weex_tool.weex_debugger.scenes', { feature: 'simrun', status: 'fail' });
      debuggerRouter.pushMessage('page.entry', {
        method: 'WxDebug.prompt',
        params: {
          messageText: 'start simulator error',
          channelId: message.payload.params
        }
      });
    });
  }
}).at('page.entry');
