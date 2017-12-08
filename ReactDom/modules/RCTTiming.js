/**
 * @providesModule RCTTiming
 * @flow
 */

import RCTBridge from "RCTBridge";
import RCTModule from "RCTModule";

type Timer = {
  callbackId: number,
  duration: number,
  jsSchedulingTime: number,
  repeats: boolean
};

const IDLE_CALLBACK_THRESHOLD = 3; // Minimum idle execution time of 1ms

class RCTTiming extends RCTModule {
  timers: { [callbackId: string]: Timer };
  sendIdleEvents: boolean;
  targetFrameDuration: number;

  constructor(bridge: RCTBridge) {
    super(bridge);
    this.timers = {};
    this.sendIdleEvents = false;
    this.targetFrameDuration = 1000.0 / 60.0; // 60fps
  }

  createTimer(
    callbackId: number,
    duration: number,
    jsSchedulingTime: number,
    repeats: boolean
  ) {
    const currentTimeMillis = Date.now();
    const currentDateNowTimeMillis = jsSchedulingTime + 1000 / 60;
    const adjustedDuration = Math.max(
      0.0,
      jsSchedulingTime - currentDateNowTimeMillis + duration
    );
    const initialTargetTime = currentTimeMillis + adjustedDuration;

    const timer = {
      callbackId,
      duration,
      jsSchedulingTime: initialTargetTime,
      repeats
    };

    if (adjustedDuration === 0) {
      if (timer.repeats) {
        timer.jsSchedulingTime += timer.duration;
        this.timers[String(callbackId)] = timer;
      }
      this.bridge.enqueueJSCall("JSTimers", "callTimers", [[callbackId]]);
    } else {
      this.timers[String(callbackId)] = timer;
    }
  }

  deleteTimer(callbackId: number) {
    delete this.timers[String(callbackId)];
  }

  setSendIdleEvents(sendIdle: boolean) {
    this.sendIdleEvents = sendIdle;
  }

  _frame() {
    const toRemove = [];
    const timers = [];
    const time = Date.now();

    for (const timer in this.timers) {
      const t = this.timers[timer];
      if (t.jsSchedulingTime <= time) {
        timers.push(this.timers[timer].callbackId);
        if (t.repeats) {
          t.jsSchedulingTime += t.duration;
        } else {
          toRemove.push(timer);
        }
      }
    }

    // timer information is distributed in a single message with mulitiple params
    // which minimizes the bridge traffic when many timers are used
    if (timers.length) {
      this.bridge.enqueueJSCall("JSTimers", "callTimers", [timers]);
    }

    for (const timer of toRemove) {
      delete this.timers[timer];
    }
  }

  _idle(frameStart: number) {
    if (!this.sendIdleEvents) {
      return;
    }
    const now = window.performance ? performance.now() : Date.now();
    const frameElapsed = now - frameStart;
    if (this.targetFrameDuration - frameElapsed >= IDLE_CALLBACK_THRESHOLD) {
      this.bridge.enqueueJSCall("JSTimers", "callIdleCallbacks", [
        Date.now() - frameElapsed
      ]);
    }
  }

  _shouldContinue(): boolean {
    return Object.keys(this.timers).length !== 0;
  }
}

export default RCTTiming;
