import {createMicrophoneAndCameraTracks } from "agora-rtc-sdk-ng/esm";
const appId = "78687755363a4287800e7b67be774e0f";
export const config = { mode: "rtc", codec: "vp8", appId: appId };
export const tracks = await createMicrophoneAndCameraTracks();
