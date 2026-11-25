export const VIDEO_FPS = 60;

export function secondsToFrames(seconds: number) {
  return Math.max(1, Math.ceil(seconds * VIDEO_FPS));
}
