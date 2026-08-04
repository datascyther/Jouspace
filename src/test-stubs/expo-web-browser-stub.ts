const WebBrowser = {
  openAuthSessionAsync: () => Promise.resolve({ type: 'dismiss' }),
  openBrowserAsync: () => Promise.resolve({ type: 'dismiss' }),
  maybeCompleteAuthSession: () => {},
};
export default WebBrowser;
export const openAuthSessionAsync = WebBrowser.openAuthSessionAsync;
export const openBrowserAsync = WebBrowser.openBrowserAsync;
export const maybeCompleteAuthSession = WebBrowser.maybeCompleteAuthSession;
