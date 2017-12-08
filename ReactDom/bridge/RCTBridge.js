/**
 * @providesModule RCTBridge
 * @flow
 */
import invariant from "Invariant";
import { moduleConfigFactory } from "RCTModuleConfig";
import NotificationCenter from "NotificationCenter";
import RCTModule from "RCTModule";
import type { ModuleConfig } from "RCTModuleConfig";
import type RCTEventDispatcher from "RCTEventDispatcher";
import type RCTImageLoader from "RCTImageLoader";
import type RCTDeviceInfo from "RCTDeviceInfo";
import type RCTDevLoadingView from "RCTDevLoadingView";
import type RCTDevSettings from "RCTDevSettings";
import type RCTUIManager from "RCTUIManager";

type MessagePayload = {
  data: {
    topic: string,
    payload: any
  }
};

type NativeCall = {
  moduleId: number,
  methodId: number,
  args: Array<any>
};

const MODULE_IDS = 0;
const METHOD_IDS = 1;
const PARAMS = 2;

const DEVTOOLS_FLAG = /\bdevtools\b/;
const HOTRELOAD_FLAG = /\bhotreload\b/;

// $FlowFixMe
let WORKER_SRC = preval`
  const fs = require('fs');
  const path = require('path');

  module.exports = fs.readFileSync(
    path.resolve(__dirname, 'RCTBridge.worker.js'),
    'utf8'
  );
`;

if (__DEV__) {
  WORKER_SRC = "__DEV__ = true;\n" + WORKER_SRC;
  if (DEVTOOLS_FLAG.test(location.search)) {
    WORKER_SRC = "__DEVTOOLS__ = true;\n" + WORKER_SRC;
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log(
        "We detected that you have the React Devtools extension installed. " +
          "Please note that at this time, React VR is only compatible with the " +
          "standalone React Native Inspector that ships with Nuclide."
      );
    }
  }
} else {
  WORKER_SRC = "__DEV__ = false;\n" + WORKER_SRC;
}

export interface ModuleClass {
  static __moduleName: ?string;
  constructor(bridge: RCTBridge): ModuleClass;
  setBridge?: RCTBridge => void;
  constantsToExport?: () => { [string]: any };
  [string]: ?Function;
}

export function bridgeModuleNameForClass(cls: Class<RCTModule>): string {
  let name = cls.name;

  if (name != null) {
    if (name.startsWith("RK")) {
      name = name.substring(2);
    } else if (name.startsWith("RCT")) {
      name = name.substring(3);
    }
    return name;
  }

  return "";
}

export default class RCTBridge {
  modulesByName: { [name: string]: RCTModule } = {};
  moduleClasses: Array<Class<RCTModule>> = [];
  moduleConfigs: Array<ModuleConfig> = [];
  nativeModules: Class<RCTModule>[];

  bundleFinishedLoading: ?() => void;
  messages: Array<NativeCall> = [];
  moduleName: string;
  bundleLocation: string;
  loading: boolean;

  _uiManager: ?RCTUIManager;
  _eventDispatcher: ?RCTEventDispatcher;
  _imageLoader: ?RCTImageLoader;
  _deviceInfo: ?RCTDeviceInfo;
  _devLoadingView: ?RCTDevLoadingView;
  _devSettings: ?RCTDevSettings;

  constructor(
    moduleName: string,
    bundle: string,
    nativeModules: Class<RCTModule>[]
  ) {
    this.loading = true;
    this.moduleName = moduleName;
    this.bundleLocation = bundle;
    this.nativeModules = nativeModules;

    const bridgeCodeBlob = new Blob([WORKER_SRC]);
    const worker = new Worker(URL.createObjectURL(bridgeCodeBlob));
    this.setThread(worker);
  }

  moduleForClass(cls: Class<RCTModule>): RCTModule {
    invariant(cls.__moduleName, "Class does not seem to be exported");
    return this.modulesByName[bridgeModuleNameForClass(cls)];
  }

  queue: Array<any> = [];
  executing: boolean = false;
  thread: ?Worker;

  setThread(thread: Worker) {
    this.thread = thread;
    thread.onmessage = this.onMessage.bind(this);
  }

  sendMessage(topic: string, payload: any) {
    if (this.thread) {
      this.thread.postMessage(JSON.stringify({ topic, payload }));
    }
  }

  callNativeModule(moduleId: number, methodId: number, params: Array<any>) {
    const [name] = this.moduleConfigs[moduleId];
    this.modulesByName[name]._functionMap[methodId].apply(
      this.modulesByName[name],
      params
    );
  }

  onMessage(message: any) {
    const { topic, payload } = JSON.parse(message.data);

    switch (topic) {
      case "bundleFinishedLoading": {
        this.loading = false;
        NotificationCenter.emitEvent("RCTJavaScriptDidLoadNotification");
        if (this.bundleFinishedLoading) {
          this.bundleFinishedLoading();
        }
        break;
      }
      case "flushedQueue": {
        if (payload != null && Array.isArray(payload)) {
          const [moduleIds, methodIds, params] = payload;
          for (let i = 0; i < moduleIds.length; i++) {
            this.messages.push({
              moduleId: moduleIds[i],
              methodId: methodIds[i],
              args: params[i]
            });
          }
        }
        break;
      }
      case "updateProgress": {
        this.devLoadingView.updateProgress(payload);
        break;
      }
      default: {
        console.warn(`Unknown topic: ${topic}`);
      }
    }

    if (this.shouldContinue()) {
      this.uiManager.requestTick();
    }
  }

  initializeModules = () => {
    this.nativeModules.forEach((moduleClass: Class<RCTModule>) => {
      const module = new moduleClass((this: any));
      const moduleName = bridgeModuleNameForClass(moduleClass);
      invariant(
        !this.modulesByName.hasOwnProperty(moduleName),
        `Multiple native modules with name ${
          moduleName
        } are registered in RCTBridge`
      );
      this.modulesByName[moduleName];
    });
  };

  loadBridgeConfig() {
    const config = this.getInitialModuleConfig();
    this.sendMessage("loadBridgeConfig", {
      config,
      bundle: this.bundleLocation
    });
  }

  getInitialModuleConfig = () => {
    const remoteModuleConfig = Object.keys(this.modulesByName).map(
      moduleName => {
        const bridgeModule = this.modulesByName[moduleName];
        return bridgeModule._describe();
      }
    );
    return { remoteModuleConfig };
  };

  enqueueJSCall(moduleName: string, methodName: string, args: Array<any>) {
    this.sendMessage("callFunctionReturnFlushedQueue", [
      moduleName,
      methodName,
      args
    ]);
  }

  enqueueJSCallWithDotMethod(moduleDotMethod: string, args: Array<any>) {
    const ids = moduleDotMethod.split(".");
    const module = ids[0];
    const method = ids[1];
    this.enqueueJSCall(module, method, args);
  }

  enqueueJSCallback(id: number, args: Array<any>) {
    this.sendMessage("invokeCallbackAndReturnFlushedQueue", [id, args]);
  }

  callbackFromId(id: number) {
    return (...args: Array<any>) => {
      this.enqueueJSCallback(id, args);
    };
  }

  get uiManager(): RCTUIManager {
    if (!this._uiManager) {
      const uiManager: any = this.modulesByName["UIManager"];
      this._uiManager = uiManager;
    }
    return this._uiManager;
  }

  get devLoadingView(): RCTDevLoadingView {
    if (!this._devLoadingView) {
      const devLoadingView: any = this.modulesByName["DevLoadingView"];
      this._devLoadingView = devLoadingView;
    }
    return this._devLoadingView;
  }

  get eventDispatcher(): RCTEventDispatcher {
    if (!this._eventDispatcher) {
      const eventDispatcher: any = this.modulesByName["EventDispatcher"];
      this._eventDispatcher = eventDispatcher;
    }
    return this._eventDispatcher;
  }

  get imageLoader(): RCTImageLoader {
    if (!this._imageLoader) {
      const imageLoader: any = this.modulesByName["ImageLoader"];
      this._imageLoader = imageLoader;
    }
    return this._imageLoader;
  }

  get deviceInfo(): RCTDeviceInfo {
    if (!this._deviceInfo) {
      const deviceInfo: any = this.modulesByName["DeviceInfo"];
      this._deviceInfo = deviceInfo;
    }
    return this._deviceInfo;
  }

  get devSettings(): RCTDevSettings {
    if (!this._devSettings) {
      const devSettings: any = this.modulesByName["DevSettings"];
      this._devSettings = devSettings;
    }
    return this._devSettings;
  }

  frame() {
    this.sendMessage("flush");

    const messages = [...this.messages];
    this.messages = [];

    messages.forEach(({ moduleId, methodId, args }) => {
      this.callNativeModule(moduleId, methodId, args);
    });
  }

  shouldContinue(): boolean {
    return this.messages.length !== 0;
  }
}
