// Next.js requires this file to be named middleware.ts (or .js).
// The implementation lives in proxy.ts to keep the auth logic separate.
export { proxy as default, config } from "./proxy";
