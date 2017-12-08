/**
 * @providesModule RCTDeviceInfo
 * @flow
 */

import RCTBridge from "RCTBridge";
import RCTEventEmitter from "RCTNativeEventEmitter";

class RCTDeviceInfo extends RCTEventEmitter {
  static name = "RCTDeviceInfo";

  constructor(bridge: RCTBridge) {
    super(bridge);

    window.addEventListener(
      "resize",
      this._didUpdateDimensions.bind(this),
      false
    );

    window
      .matchMedia("screen and (min-resolution: 2dppx)")
      .addListener(this._didUpdateDimensions.bind(this));

    this.listenerCount = 1;
  }

  constantsToExport() {
    return {
      Dimensions: this._exportedDimensions()
    };
  }

  _supportedEvents() {
    return ["didUpdateDimensions"];
  }

  _exportedDimensions() {
    const dims = {
      width: Math.ceil(window.innerWidth),
      height: Math.ceil(window.innerHeight),
      scale: this._getDevicePixelRatio(),
      fontScale: 1
    };

    return {
      window: dims,
      screen: dims
    };
  }

  _getDevicePixelRatio(): number {
    let ratio = 1;
    // To account for zoom, change to use deviceXDPI instead of systemXDPI
    if (
      window.screen.systemXDPI !== undefined &&
      window.screen.logicalXDPI !== undefined &&
      window.screen.systemXDPI > window.screen.logicalXDPI
    ) {
      // Only allow for values > 1
      ratio = window.screen.systemXDPI / window.screen.logicalXDPI;
    } else if (window.devicePixelRatio !== undefined) {
      ratio = window.devicePixelRatio;
    }

    // iOS displays with 3x ratio don't properly display hairlines
    // so set max ratio to 2
    return Math.min(ratio, 2);
  }

  _didUpdateDimensions() {
    this.sendEventWithName("didUpdateDimensions", this._exportedDimensions());
  }
}

export default RCTDeviceInfo;
