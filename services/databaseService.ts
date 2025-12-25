
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  limit, 
  orderBy, 
  writeBatch 
} from "firebase/firestore";
// Fix: Consolidated auth imports into a single line to ensure correct member resolution in specific build environments
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, firestore } from "./firebaseConfig";
import { User, Message, Post, Comment } from "../types";

class DatabaseService {
  async register(name: string, email: string, phone: string, password: string): Promise<User> {
    try {
      const phoneQuery = query(collection(firestore, "users"), where("phone", "==", phone));
      const phoneSnap = await getDocs(phoneQuery);
      if (!phoneSnap.empty) throw new Error("Phone number already registered.");

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const newUser: User = {
        id: firebaseUser.uid,
        name,
        email,
        phone,
        showPhone: true,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
        bio: "Hello, I am using Saad Social App!",
        language: 'en',
        friends: [],
        sentRequests: [],
        receivedRequests: []
      };
      await setDoc(doc(firestore, "users", firebaseUser.uid), newUser);
      return newUser;
    } catch (error) { throw error; }
  }

  async login(email: string, password: string): Promise<User | null> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(firestore, "users", userCredential.user.uid));
    return userDoc.exists() ? (userDoc.data() as User) : null;
  }

  async logout() { await signOut(auth); }

  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
        callback(userDoc.exists() ? (userDoc.data() as User) : null);
      } else callback(null);
    });
  }

  async updateProfile(userId: string, data: Partial<User>) {
    await updateDoc(doc(firestore, "users", userId), data);
  }

  async getUser(id: string): Promise<User | null> {
    const userDoc = await getDoc(doc(firestore, "users", id));
    return userDoc.exists() ? (userDoc.data() as User) : null;
  }

  async searchUsers(excludeId: string, searchTerm: string): Promise<User[]> {
    const querySnapshot = await getDocs(query(collection(firestore, "users"), limit(50)));
    const users: User[] = [];
    const term = searchTerm.toLowerCase();
    querySnapshot.forEach((doc) => {
      const data = doc.data() as User;
      if (data.id !== excludeId && (!searchTerm || data.name.toLowerCase().includes(term) || data.phone.includes(term))) {
        users.push(data);
      }
    });
    return users;
  }

  async sendFriendRequest(fromId: string, toId: string) {
    await updateDoc(doc(firestore, "users", fromId), { sentRequests: arrayUnion(toId) });
    await updateDoc(doc(firestore, "users", toId), { receivedRequests: arrayUnion(fromId) });
  }

  async acceptFriendRequest(userId: string, targetId: string) {
    await updateDoc(doc(firestore, "users", userId), { receivedRequests: arrayRemove(targetId), friends: arrayUnion(targetId) });
    await updateDoc(doc(firestore, "users", targetId), { sentRequests: arrayRemove(userId), friends: arrayUnion(userId) });
  }

  async rejectFriendRequest(userId: string, targetId: string) {
    await updateDoc(doc(firestore, "users", userId), { receivedRequests: arrayRemove(targetId) });
    await updateDoc(doc(firestore, "users", targetId), { sentRequests: arrayRemove(userId) });
  }

  async createPost(user: User, text: string, image?: string) {
    const postsRef = collection(firestore, "posts");
    await addDoc(postsRef, {
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      text,
      image: image || null,
      timestamp: Date.now(),
      reactions: { like: [], love: [], haha: [] },
      comments: []
    });
  }

  subscribeToFeed(userId: string, friendIds: string[], callback: (posts: Post[]) => void) {
    const postsRef = collection(firestore, "posts");
    const q = query(postsRef, orderBy("timestamp", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
      const posts: Post[] = [];
      const allowedIds = [userId, ...friendIds];
      snapshot.forEach((doc) => {
        const data = doc.data() as Post;
        if (allowedIds.includes(data.authorId)) {
          posts.push({ ...data, id: doc.id });
        }
      });
      callback(posts);
    });
  }

  async addReaction(postId: string, userId: string, type: 'like' | 'love' | 'haha') {
    const postRef = doc(firestore, "posts", postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    const data = postSnap.data() as Post;
    const currentReactions = { ...data.reactions };

    if (!currentReactions[type].includes(userId)) {
      currentReactions[type].push(userId);
    } else {
      currentReactions[type] = currentReactions[type].filter(id => id !== userId);
    }

    await updateDoc(postRef, { reactions: currentReactions });
  }

  async addComment(postId: string, user: User, text: string) {
    const postRef = doc(firestore, "posts", postId);
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      text,
      timestamp: Date.now()
    };
    await updateDoc(postRef, { comments: arrayUnion(newComment) });
  }

  async sendMessage(senderId: string, receiverId: string, text?: string, image?: string, audio?: string) {
    await addDoc(collection(firestore, "messages"), {
      senderId, 
      receiverId, 
      text: text || null, 
      image: image || null, 
      audio: audio || null, 
      timestamp: Date.now(), 
      read: false
    });
  }

  async markMessagesAsRead(receiverId: string, senderId: string) {
    const q = query(collection(firestore, "messages"), 
      where("receiverId", "==", receiverId), 
      where("senderId", "==", senderId), 
      where("read", "==", false)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(firestore);
    snap.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  }

  subscribeToMessages(u1: string, u2: string, callback: (messages: Message[]) => void) {
    const q = query(collection(firestore, "messages"), where("senderId", "in", [u1, u2]));
    return onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as Message;
        if ((data.senderId === u1 && data.receiverId === u2) || (data.senderId === u2 && data.receiverId === u1)) {
          msgs.push({ ...data, id: doc.id });
        }
      });
      msgs.sort((a, b) => a.timestamp - b.timestamp);
      callback(msgs);
    });
  }

  subscribeToAllUnread(userId: string, callback: (unreadMap: Record<string, number>) => void) {
    const q = query(collection(firestore, "messages"), where("receiverId", "==", userId), where("read", "==", false));
    return onSnapshot(q, (snapshot) => {
      const map: Record<string, number> = {};
      snapshot.forEach(doc => {
        const data = doc.data() as Message;
        map[data.senderId] = (map[data.senderId] || 0) + 1;
      });
      callback(map);
    });
  }

  subscribeToUser(userId: string, callback: (user: User) => void) {
    return onSnapshot(doc(firestore, "users", userId), (doc) => {
      if (doc.exists()) callback(doc.data() as User);
    });
  }
}

export const db = new DatabaseService();
