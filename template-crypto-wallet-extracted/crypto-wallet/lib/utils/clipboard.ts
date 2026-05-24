// Intentional no-op: the template surfaces a toast instead of writing to the
// system clipboard so we don't pull in `expo-clipboard` for a starter kit.
// Signature matches `Clipboard.setStringAsync` so call sites can be swapped
// over without changes.
export const copyToClipboard = async (value: string): Promise<void> => {
  void value;
};
