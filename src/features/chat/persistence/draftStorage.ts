import AsyncStorage from '@react-native-async-storage/async-storage';

const OLD_PREFIX = 'neeva_chat_draft_';
const DRAFT_KEY_PREFIX = 'jouspace_chat_draft_';

export async function saveDraft(conversationId: string, text: string): Promise<void> {
  const newKey = `${DRAFT_KEY_PREFIX}${conversationId}`;
  const oldKey = `${OLD_PREFIX}${conversationId}`;
  if (!text.trim()) {
    await AsyncStorage.multiRemove([newKey, oldKey]);
    return;
  }
  await AsyncStorage.setItem(newKey, text);
  await AsyncStorage.removeItem(oldKey);
}

export async function loadDraft(conversationId: string): Promise<string> {
  const newKey = `${DRAFT_KEY_PREFIX}${conversationId}`;
  const newVal = await AsyncStorage.getItem(newKey);
  if (newVal !== null) return newVal;
  const oldKey = `${OLD_PREFIX}${conversationId}`;
  const oldVal = await AsyncStorage.getItem(oldKey);
  if (oldVal !== null) {
    await AsyncStorage.setItem(newKey, oldVal);
    await AsyncStorage.removeItem(oldKey);
    return oldVal;
  }
  return '';
}

export async function clearDraft(conversationId: string): Promise<void> {
  await AsyncStorage.multiRemove([
    `${DRAFT_KEY_PREFIX}${conversationId}`,
    `${OLD_PREFIX}${conversationId}`,
  ]);
}
