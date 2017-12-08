/**
 * @providesModule RCTNativeEventEmitter
 * @flow
 */

import invariant from "Invariant";
import RCTBridge from "RCTBridge";
import RCTModule from "RCTModule";
import NotificationCenter from "NotificationCenter";

class RCTEventEmitter extends RCTModule {
  listenerCount: number = 0;
  _supportedMethods: ?Array<string>;

  constructor(bridge: RCTBridge, supportedMethods: ?Array<string>) {
    super(bridge);
    this._supportedMethods = supportedMethods;
  }

  _supportedMethods(): ?Array<string> {
    return this._supportedMethods;
  }

  sendEventWithName(eventName: string, body: any) {
    invariant(
      this.bridge,
      "bridge is not set. This is probably because you've" +
        `explicitly synthesized the bridge in ${
          this.constructor.name
        }, even though it's inherited ` +
        "from RCTEventEmitter."
    );

    // TODO: Add debug check for supportedEvents

    if (this.listenerCount > 0) {
      this.bridge.enqueueJSCall(
        "RCTDeviceEventEmitter",
        "emit",
        body ? [eventName, body] : [eventName]
      );
      NotificationCenter.emitEvent(eventName, [body]);
    } else {
      console.warn(`Sending ${eventName} with no listeners registered`);
    }
  }

  _startObserving() {
    /* Does Nothing */
  }

  _stopObserving() {
    /* Does Nothing */
  }

  addListener(eventName: string, callback: ?(body: any) => void) {
    // TODO: Add debug check for supportedEvents
    if (callback != null) {
      NotificationCenter.addListener(eventName, callback);
    }

    this.listenerCount++;
    if (this.listenerCount === 1) {
      this._startObserving();
    }
  }

  _removeListener(eventName: string, callback: ?Function) {
    if (callback != null) {
      NotificationCenter.removeListener(eventName, callback);
    }
    this.removeListeners(1);
  }

  removeListeners(count: number) {
    // TODO: Add debug check for supportedEvents
    this.listenerCount = Math.max(this.listenerCount - count, 0);
    if (this.listenerCount === 0) {
      this._stopObserving();
    }
  }
}

export default RCTEventEmitter;
