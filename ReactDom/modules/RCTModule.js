/**
 * @providesModule RCTModule
 * @flow
 */

import invariant from "Invariant";

import type { ModuleConfig } from "RCTModuleConfig";
import type RCTBridge from "RCTBridge";

export default class RCTModule {
  static name: string = "__unamed__";

  _functionMap: Array<() => any>;

  bridge: RCTBridge;

  constructor(bridge: RCTBridge) {
    this.bridge = bridge;
    this._functionMap = [];
  }

  constantsToExport(): ?{ [const: string]: any } {
    return null;
  }

  _describe(): ModuleConfig {
    const constants = this.constantsToExport();
    const functions = [];
    const promiseFunctions = [];
    const syncFunctions = []; // Not currently supported

    let methodID = 0;

    const proto: any = Object.getPrototypeOf(this);
    const protoMembers = Object.getOwnPropertyNames(proto);
    for (const attr of protoMembers) {
      const member = proto[attr];

      if (
        attr[0] === "_" ||
        attr === "constructor" ||
        attr === "constantsToExport" ||
        typeof member !== "function"
      ) {
        continue;
      }

      let name = attr;

      if (name[0] === "$") {
        name = name.substring(1);
        promiseFunctions.push(methodID);
      }

      this._functionMap[methodID] = member;
      functions.push(name);
      methodID++;
    }

    return [
      this.constructor.name,
      constants,
      functions,
      promiseFunctions,
      syncFunctions
    ];
  }
}
