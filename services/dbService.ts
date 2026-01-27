
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  query,
  where
} from "firebase/firestore";
import { db } from "./firebase.ts";
import { User, Quest, Progress, SystemConfig } from "../types.ts";

const COLLECTIONS = {
  USERS: 'users',
  QUESTS: 'quests',
  PROGRESS: 'progress',
  CONFIG: 'system_config'
};

export const dbService = {
  // Config
  async getConfig(): Promise<SystemConfig | null> {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'global');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as SystemConfig : null;
  },
  async saveConfig(config: SystemConfig) {
    await setDoc(doc(db, COLLECTIONS.CONFIG, 'global'), config);
  },

  // Users
  async getUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },
  async saveUser(user: User) {
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), user);
  },
  async deleteUser(userId: string) {
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
  },

  // Quests
  async getQuests(): Promise<Quest[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.QUESTS));
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Quest))
      .sort((a, b) => a.order - b.order);
  },
  async saveQuest(quest: Quest) {
    await setDoc(doc(db, COLLECTIONS.QUESTS, quest.id), quest);
  },
  async deleteQuest(questId: string) {
    await deleteDoc(doc(db, COLLECTIONS.QUESTS, questId));
  },

  // Progress
  async getProgress(): Promise<Progress[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.PROGRESS));
    return querySnapshot.docs.map(doc => doc.data() as Progress);
  },
  async saveProgress(progress: Progress) {
    const id = `${progress.userId}_${progress.levelId}`;
    await setDoc(doc(db, COLLECTIONS.PROGRESS, id), progress);
  }
};
