/**
 * @providesModule ReactDom
 * @flow
 */
import "proxy-polyfill";

global.process = global.process || {};
global.process.env = global.process.env || {};
if (!global.process.env.NODE_ENV) {
  global.process.env.NODE_ENV = __DEV__ ? "development" : "production";
}

import RCTRootView from "RCTRootView";
import bundleFromRoot from "BundleFromRoot";

import type RCTModule from "RCTModule";

const builtinNativeModules: Class<RCTModule>[] = [];

// Register Built-in Native Modules
import "RCTEventDispatcher";
import "RCTDeviceInfo";
import "RCTPlatform";
import "RCTTiming";
import "RCTUIManager";
import "RCTViewManager";
import "RCTTextManager";
import "RCTRawTextManager";
import "RCTScrollViewManager";
import "RCTNativeAnimatedModule";
import "RCTAsyncLocalStorage";
import "RCTImageViewManager";
import "RCTLinkingManager";
import "RCTSourceCode";
import "RCTTextInputManager";
import "RCTImageLoader";
import "RCTActivityIndicatorViewManager";
import "RCTWebSocketModule";
import "RCTAppState";
import "RCTSafeAreaViewManager";
import "RCTSwitchManager";
import "RCTStatusBarManager";

// Development Related Native Modules
if (__DEV__) {
  require("RCTDevLoadingView");
  require("RCTDevSettings");
  require("RCTDevMenu");
}

type RNDomInstanceOptions = {
  enableHotReload?: boolean,
  nativeModules?: Class<RCTModule>[]
};

// React Native Web Entrypoint instance
export class RNDomInstance {
  rootView: RCTRootView;

  constructor(
    bundle: string,
    moduleName: string,
    parent: Element,
    options: RNDomInstanceOptions = {}
  ) {
    const enableHotReload = options.enableHotReload
      ? options.enableHotReload
      : false;

    const userNativeModules = options.nativeModules
      ? options.nativeModules
      : [];

    this.rootView = new RCTRootView(
      bundleFromRoot(bundle),
      moduleName,
      parent,
      builtinNativeModules.concat(userNativeModules),
      enableHotReload
    );
  }

  start() {
    this.rootView.render();
  }
}
