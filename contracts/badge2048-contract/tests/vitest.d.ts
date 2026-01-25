import { Cl } from "@stacks/transactions";
import "vitest";

declare module "vitest" {
  interface Assertion<T = any> {
    toBeOk(expected?: T): void;
    toBeErr(expected?: T): void;
    toBeSome(expected?: T): void;
    toBeNone(): void;
    toBeUint(expected?: number | bigint): void;
    toBeInt(expected?: number | bigint): void;
    toBeBool(expected?: boolean): void;
    toBePrincipal(expected?: string): void;
    toBeStringAscii(expected?: string): void;
    toBeStringUtf8(expected?: string): void;
  }
}

declare global {
  const simnet: {
    deployer: string;
    accounts: Map<string, string> | Record<string, string>;
    callPublicFn: (
      contract: string,
      functionName: string,
      args: any[],
      sender: string
    ) => { result: any; events: any[] };
    callReadOnlyFn: (
      contract: string,
      functionName: string,
      args: any[],
      sender: string
    ) => { result: any };
    getDataVar: (contract: string, varName: string) => any;
    getMapEntry: (contract: string, mapName: string, key: any) => any;
  };
}
