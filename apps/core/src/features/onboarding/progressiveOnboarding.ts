export type ProgressiveTipKey = 'first_review' | 'first_add_listing';

export async function shouldShowProgressiveTip(_key: ProgressiveTipKey): Promise<boolean> {
  void _key;
  return false;
}

export async function markProgressiveTipSeen(_key: ProgressiveTipKey): Promise<void> {
  void _key;
}
