const Linking = {
  createURL: (path: string) => 'jouspace://' + path,
  addEventListener: () => ({ remove: () => {} }),
  getInitialURL: () => Promise.resolve(null),
};
export default Linking;
export const createURL = Linking.createURL;
export const addEventListener = Linking.addEventListener;
export const getInitialURL = Linking.getInitialURL;
