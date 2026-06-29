import type { PlatformResult } from "../../schema/result.js";
import { captureGenericChat, type CaptureOptions } from "../generic-chat.js";
import type { PlatformConfig } from "../platform-registry.js";

export async function captureDknowcChat(
  config: PlatformConfig,
  options: CaptureOptions
): Promise<PlatformResult> {
  return captureGenericChat(config, options);
}
