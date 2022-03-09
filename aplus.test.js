import { adapter } from "./adapter.js";
import { mocha } from "promises-aplus-tests"

describe("Promises/A+ Tests", function () {
  mocha(adapter);
});