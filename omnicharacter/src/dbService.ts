/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  deleteDoc
} from 'firebase/firestore';
import { UserProfile, Character, Message, Conversation, MemoryItem, Folder } from './types';
import { INITIAL_CHARACTERS, INITIAL_ACHIEVEMENTS } from './initialData';

// Local storage keys
const KEYS = {
  PROFILE: 'omnichar_profile_',
  CHARACTERS: 'omnichar_custom_characters',
  CONVERSATIONS: 'omnichar_conversations_',
  MESSAGES: 'omnichar_messages_',
  MEMORIES: 'omnichar_memories_',
  LIKES: 'omnichar_likes_',
  FAVORITES: 'omnichar_favorites_',
  FOLDERS: 'omnichar_folders_',
};

// Safe wrapper to check if Firestore is operational
const isFirestoreOnline = () => {
  return db !== null;
};

// --- USER PROFILES ---

export async function getUserProfile(uid: string): Promise<UserProfile> {
  // 1. Try Firestore
  if (isFirestoreOnline()) {
    try {
      const userRef = doc(db!, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        if (data.email === 'shadowfall07042008@gmail.com') {
          data.isCreator = true;
          data.isAdmin = true;
        }
        localStorage.setItem(KEYS.PROFILE + uid, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn("Firestore getUserProfile error, falling back to LocalStorage", e);
    }
  }

  // 2. Fallback to LocalStorage
  const localData = localStorage.getItem(KEYS.PROFILE + uid);
  if (localData) {
    const parsed: UserProfile = JSON.parse(localData);
    if (parsed.email === 'shadowfall07042008@gmail.com') {
      parsed.isCreator = true;
      parsed.isAdmin = true;
    }
    return parsed;
  }

  // 3. Create a fresh profile
  const userEmail = auth?.currentUser?.email || null;
  const isCreatorUser = userEmail === 'shadowfall07042008@gmail.com';
  const freshProfile: UserProfile = {
    uid,
    displayName: auth?.currentUser?.displayName || userEmail?.split('@')[0] || 'Guest User',
    email: userEmail,
    photoURL: auth?.currentUser?.photoURL || null,
    bio: 'No bio added yet. Tell us about yourself!',
    isAnonymous: auth?.currentUser?.isAnonymous || true,
    isCreator: isCreatorUser,
    isAdmin: isCreatorUser,
    followersCount: 0,
    followingCount: 0,
    favorites: [],
    likes: [],
    badges: ['New Joiner'],
    achievements: INITIAL_ACHIEVEMENTS.map(a => ({ ...a, unlockedAt: '' })),
    stats: {
      totalChats: 0,
      totalMessages: 0,
      creationsCount: 0,
      streakDays: 1,
    },
    createdAt: new Date().toISOString()
  };

  await saveUserProfile(freshProfile);
  return freshProfile;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  // Always update local storage first for zero-latency
  localStorage.setItem(KEYS.PROFILE + profile.uid, JSON.stringify(profile));

  if (isFirestoreOnline()) {
    try {
      const userRef = doc(db!, 'users', profile.uid);
      await setDoc(userRef, profile, { merge: true });
    } catch (e) {
      console.warn("Firestore saveUserProfile failed", e);
    }
  }
}

// --- CHARACTERS ---

export async function getCharacters(): Promise<Character[]> {
  let firebaseCharacters: Character[] = [];

  // 1. Try Firestore
  if (isFirestoreOnline()) {
    try {
      const charRef = collection(db!, 'characters');
      const q = query(charRef, where('visibility', '==', 'public'));
      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        firebaseCharacters.push({ id: docSnap.id, ...docSnap.data() } as Character);
      });
    } catch (e) {
      console.warn("Firestore getCharacters failed, using offline", e);
    }
  }

  // 2. Try LocalStorage for user custom characters
  let localCharacters: Character[] = [];
  const localData = localStorage.getItem(KEYS.CHARACTERS);
  if (localData) {
    localCharacters = JSON.parse(localData);
  }

  // Merge: Initial built-ins + User created locally + User created in Firebase
  const initialMap = new Map<string, Character>();
  INITIAL_CHARACTERS.forEach(c => initialMap.set(c.id, c));
  
  // Local overwrites/adds
  localCharacters.forEach(c => initialMap.set(c.id, c));
  
  // Firebase overwrites/adds
  firebaseCharacters.forEach(c => initialMap.set(c.id, c));

  return Array.from(initialMap.values());
}

export async function saveCharacter(character: Character): Promise<void> {
  // Save in LocalStorage
  let localCharacters: Character[] = [];
  const localData = localStorage.getItem(KEYS.CHARACTERS);
  if (localData) {
    localCharacters = JSON.parse(localData);
  }
  
  const index = localCharacters.findIndex(c => c.id === character.id);
  if (index >= 0) {
    localCharacters[index] = character;
  } else {
    localCharacters.push(character);
  }
  localStorage.setItem(KEYS.CHARACTERS, JSON.stringify(localCharacters));

  // Save in Firestore
  if (isFirestoreOnline()) {
    try {
      const charRef = doc(db!, 'characters', character.id);
      await setDoc(charRef, character, { merge: true });
    } catch (e) {
      console.warn("Firestore saveCharacter failed", e);
    }
  }
}

// --- CONVERSATIONS ---

export async function getConversations(userId: string): Promise<Conversation[]> {
  if (isFirestoreOnline()) {
    try {
      const convRef = collection(db!, 'conversations');
      const q = query(convRef, where('userId', '==', userId), orderBy('lastMessageAt', 'desc'));
      const snap = await getDocs(q);
      const convs: Conversation[] = [];
      snap.forEach(docSnap => {
        convs.push({ id: docSnap.id, ...docSnap.data() } as Conversation);
      });
      if (convs.length > 0) {
        localStorage.setItem(KEYS.CONVERSATIONS + userId, JSON.stringify(convs));
        return convs;
      }
    } catch (e) {
      console.warn("Firestore getConversations error, using offline", e);
    }
  }

  const localData = localStorage.getItem(KEYS.CONVERSATIONS + userId);
  return localData ? JSON.parse(localData) : [];
}

export async function saveConversation(userId: string, conversation: Conversation): Promise<void> {
  // Update LocalStorage
  const conversations = await getConversations(userId);
  const index = conversations.findIndex(c => c.id === conversation.id);
  if (index >= 0) {
    conversations[index] = conversation;
  } else {
    conversations.unshift(conversation);
  }
  // Sort by last message time
  conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  localStorage.setItem(KEYS.CONVERSATIONS + userId, JSON.stringify(conversations));

  // Update Firestore
  if (isFirestoreOnline()) {
    try {
      const convRef = doc(db!, 'conversations', conversation.id);
      await setDoc(convRef, { ...conversation, userId }, { merge: true });
    } catch (e) {
      console.warn("Firestore saveConversation failed", e);
    }
  }
}

export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  // 1. LocalStorage
  const conversations = await getConversations(userId);
  const filtered = conversations.filter(c => c.id !== conversationId);
  localStorage.setItem(KEYS.CONVERSATIONS + userId, JSON.stringify(filtered));
  localStorage.removeItem(KEYS.MESSAGES + conversationId);

  // 2. Firestore
  if (isFirestoreOnline()) {
    try {
      await deleteDoc(doc(db!, 'conversations', conversationId));
      // Delete associated messages collection as well in real setup (handled client-side or functions)
    } catch (e) {
      console.warn("Firestore deleteConversation failed", e);
    }
  }
}

// --- MESSAGES ---

export async function getMessages(conversationId: string): Promise<Message[]> {
  if (isFirestoreOnline()) {
    try {
      const msgRef = collection(db!, 'conversations', conversationId, 'messages');
      const q = query(msgRef, orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      const msgs: Message[] = [];
      snap.forEach(docSnap => {
        msgs.push({ id: docSnap.id, ...docSnap.data() } as Message);
      });
      if (msgs.length > 0) {
        localStorage.setItem(KEYS.MESSAGES + conversationId, JSON.stringify(msgs));
        return msgs;
      }
    } catch (e) {
      console.warn("Firestore getMessages error, using offline", e);
    }
  }

  const localData = localStorage.getItem(KEYS.MESSAGES + conversationId);
  return localData ? JSON.parse(localData) : [];
}

export async function saveMessage(conversationId: string, message: Message): Promise<void> {
  // 1. LocalStorage update
  const msgs = await getMessages(conversationId);
  const index = msgs.findIndex(m => m.id === message.id);
  if (index >= 0) {
    msgs[index] = message;
  } else {
    msgs.push(message);
  }
  localStorage.setItem(KEYS.MESSAGES + conversationId, JSON.stringify(msgs));

  // 2. Firestore update
  if (isFirestoreOnline()) {
    try {
      const msgRef = doc(db!, 'conversations', conversationId, 'messages', message.id);
      await setDoc(msgRef, message, { merge: true });
    } catch (e) {
      console.warn("Firestore saveMessage failed", e);
    }
  }
}

export async function deleteMessage(conversationId: string, messageId: string): Promise<void> {
  // 1. LocalStorage
  const msgs = await getMessages(conversationId);
  const filtered = msgs.filter(m => m.id !== messageId);
  localStorage.setItem(KEYS.MESSAGES + conversationId, JSON.stringify(filtered));

  // 2. Firestore
  if (isFirestoreOnline()) {
    try {
      await deleteDoc(doc(db!, 'conversations', conversationId, 'messages', messageId));
    } catch (e) {
      console.warn("Firestore deleteMessage failed", e);
    }
  }
}

// --- RELATIONSHIP & MEMORY ---

export async function getMemories(userId: string, characterId: string): Promise<MemoryItem[]> {
  if (isFirestoreOnline()) {
    try {
      const memoryRef = collection(db!, 'memories');
      const q = query(memoryRef, where('userId', '==', userId), where('characterId', '==', characterId));
      const snap = await getDocs(q);
      const items: MemoryItem[] = [];
      snap.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as MemoryItem);
      });
      if (items.length > 0) {
        localStorage.setItem(KEYS.MEMORIES + userId + '_' + characterId, JSON.stringify(items));
        return items;
      }
    } catch (e) {
      console.warn("Firestore getMemories error, using offline", e);
    }
  }

  const localData = localStorage.getItem(KEYS.MEMORIES + userId + '_' + characterId);
  return localData ? JSON.parse(localData) : [];
}

export async function saveMemory(memory: MemoryItem): Promise<void> {
  const key = KEYS.MEMORIES + memory.userId + '_' + memory.characterId;
  let items: MemoryItem[] = [];
  const localData = localStorage.getItem(key);
  if (localData) {
    items = JSON.parse(localData);
  }

  const index = items.findIndex(m => m.id === memory.id);
  if (index >= 0) {
    items[index] = memory;
  } else {
    items.push(memory);
  }
  localStorage.setItem(key, JSON.stringify(items));

  if (isFirestoreOnline()) {
    try {
      const memRef = doc(db!, 'memories', memory.id);
      await setDoc(memRef, memory, { merge: true });
    } catch (e) {
      console.warn("Firestore saveMemory failed", e);
    }
  }
}

export async function deleteMemory(userId: string, characterId: string, memoryId: string): Promise<void> {
  const key = KEYS.MEMORIES + userId + '_' + characterId;
  let items: MemoryItem[] = [];
  const localData = localStorage.getItem(key);
  if (localData) {
    items = JSON.parse(localData);
  }
  const filtered = items.filter(m => m.id !== memoryId);
  localStorage.setItem(key, JSON.stringify(filtered));

  if (isFirestoreOnline()) {
    try {
      await deleteDoc(doc(db!, 'memories', memoryId));
    } catch (e) {
      console.warn("Firestore deleteMemory failed", e);
    }
  }
}

// --- UTILS & CREATOR INFO ---

export async function getFolders(userId: string): Promise<Folder[]> {
  const localData = localStorage.getItem(KEYS.FOLDERS + userId);
  return localData ? JSON.parse(localData) : [];
}

export async function saveFolder(userId: string, folder: Folder): Promise<void> {
  const folders = await getFolders(userId);
  const index = folders.findIndex(f => f.id === folder.id);
  if (index >= 0) {
    folders[index] = folder;
  } else {
    folders.push(folder);
  }
  localStorage.setItem(KEYS.FOLDERS + userId, JSON.stringify(folders));
}

export async function deleteFolder(userId: string, folderId: string): Promise<void> {
  const folders = await getFolders(userId);
  const filtered = folders.filter(f => f.id !== folderId);
  localStorage.setItem(KEYS.FOLDERS + userId, JSON.stringify(filtered));
}
