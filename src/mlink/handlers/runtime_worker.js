const mlink = require('../midware/index');
const Router = mlink.Router;
const Logger = mlink.Logger;
const debuggerRouter = Router.get('debugger');
const DeviceManager = require('../lib/device_manager');
const RuntimeManager = require('../lib/runtime_manager');
const Hub = require('mlink').Hub;
const runtimeProxyHub = Hub.get('runtime.proxy');

debuggerRouter.registerHandler(function (message) {
  message.to('proxy.native');
}).at('sync');
debuggerRouter.registerHandler(function (message) {
  message.to('proxy.native');
}).at('runtime.worker');

debuggerRouter.on(Router.Event.TERMINAL_JOINED, 'runtime.worker', function (signal) {
  RuntimeManager.connect(signal.channelId).then(function (terminal) {
    runtimeProxyHub.join(terminal);
    const device = DeviceManager.getDevice(signal.channelId);
    if (device) {
      if (device.remoteDebug === true) {
        debuggerRouter.pushMessageByChannelId('proxy.native', signal.channelId, {
          method: 'WxDebug.reload'
        });
      }
    }
    else {
      Logger.error('device with channelId[' + signal.channelId + '] is not found');
    }
  }, errorText => {
    debuggerRouter.pushMessageByChannelId('page.debugger', signal.channelId, {
      method: 'WxDebug.prompt',
      params: {
        messageText: errorText
      }
    });
  });
});

debuggerRouter.on(Router.Event.TERMINAL_LEAVED, 'runtime.worker', function (signal) {
  if (RuntimeManager.has(signal.channelId)) {
    RuntimeManager.remove(signal.channelId);
  }
});
