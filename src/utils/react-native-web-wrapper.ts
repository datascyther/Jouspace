import * as RNWeb from 'react-native-web';

export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: (name: string) => {
    return null;
  },
};

// Re-export everything from react-native-web
export * from 'react-native-web';

// ─── Web stubs for RN APIs not implemented by react-native-web ────────────────
// These are only referenced on native (guarded by Platform.OS), but the named
// imports must still resolve at build time on web.
export const ActionSheetIOS = {
  showActionSheetWithOptions: (_options: unknown, _callback: (buttonIndex: number) => void) => {},
};

const defaultExport = {
  ...RNWeb,
  TurboModuleRegistry,
  ActionSheetIOS,
};
export default defaultExport;
