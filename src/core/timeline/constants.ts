export const VIDEO_FPS = 30;

export function secondsToFrames(seconds: number) {
  return Math.max(1, Math.ceil(seconds * VIDEO_FPS));
}
