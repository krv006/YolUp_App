export const CAMERA_SOURCE = 1;
export const MICROPHONE_SOURCE = 2;
export const SCREEN_SHARE_SOURCE = 3;

interface PublishPermissions {
  canPublish: boolean;
  canPublishSources: number[];
}

export function canPublishSource(
  permissions: PublishPermissions | null | undefined,
  source: number
): boolean {
  if (!permissions?.canPublish) return false;
  return !permissions.canPublishSources.length || permissions.canPublishSources.includes(source);
}
