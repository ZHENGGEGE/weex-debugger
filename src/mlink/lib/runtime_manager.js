const mlink = require('../midware/index');
const WebsocketTerminal = mlink.Terminal.WebsocketTerminal;
const url = require('url');
const WebSocket = require('ws');
const request = require('../../util/request');
const config = require('../../lib/config');

class RuntimeManager {
  constructor () {
    this.runtimeTerminalMap = {};
  }
  connect (channelId) {
    return new Promise((resolve, reject) => {
      request.getRemote(`http://127.0.0.1:${config.remoteDebugPort || 9222}/json`).then((data) => {
        const list = JSON.parse(data);
        let found = false;
        for (const target of list) {
          const urlObj = url.parse(target.url);
          if (urlObj.pathname === '/runtime.html' && urlObj.port === config.port) {
            found = target;
            break;
          }
          else if (urlObj.pathname === '/debug.html') {
            found = target;
          }
        }

        if (found) {
          if (found.webSocketDebuggerUrl) {
            const ws = new WebSocket(found.webSocketDebuggerUrl);
            const terminal = new WebsocketTerminal(ws, channelId);
            const _runtimeTerminalMaps = this.runtimeTerminalMap[channelId];
            if (_runtimeTerminalMaps && _runtimeTerminalMaps.length > 0) {
              _runtimeTerminalMaps.unshift(terminal);
            }
            else {
              this.runtimeTerminalMap[channelId] = [terminal];
            }
            resolve(terminal);
          }
          else {
            reject('TOAST_DO_NOT_OPEN_CHROME_DEVTOOL');
          }
        }
        else {
          reject('TOAST_CAN_NOT_FIND_RUNTIME');
        }
      }).catch((e) => {
        reject('TOAST_JS_RUNTIME_INIT_FAIL');
      });
    });
  }
  remove (channelId) {
    const terminals = this.runtimeTerminalMap[channelId];
    if (terminals && terminals.length > 0) {
      const popTerminal = terminals.pop();
      popTerminal.websocket.close();
    }
    else {
      console.error('try to remove a non-exist runtime');
    }
  }
  has (channelId) {
    const terminals = this.runtimeTerminalMap[channelId];
    return terminals && terminals.length > 0;
  }
}
module.exports = new RuntimeManager();
