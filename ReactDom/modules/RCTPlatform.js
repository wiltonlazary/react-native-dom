/**
 * @providesModule RCTPlatform
 * @flow
 */
import RCTModule from "RCTModule";

const supportsTouchForceChange = "ontouchforcechange" in window.document;

class RCTPlatformConstants extends RCTModule {
  constantsToExport() {
    return {
      forceTouchAvailable: supportsTouchForceChange,
      reactNativeVersion: {
        major: 0,
        minor: 50,
        patch: 3
      }
    };
  }
}

export default RCTPlatformConstants;
