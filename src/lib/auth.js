import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const googleProvider = new GoogleAuthProvider();

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user exists in Firestore, if not create profile
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      await createUserProfile(user);
    }
    
    return { success: true, user };
  } catch (error) {
    console.error("Google sign in error:", error);
    return { success: false, error: error.message };
  }
};

// Email/Password Sign In
export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error) {
    console.error("Email sign in error:", error);
    return { success: false, error: error.message };
  }
};

// Email/Password Sign Up
export const signUpWithEmail = async (email, password, additionalData = {}) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Create user profile in Firestore
    await createUserProfile(user, additionalData);
    
    return { success: true, user };
  } catch (error) {
    console.error("Email sign up error:", error);
    return { success: false, error: error.message };
  }
};

// Sign Out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false, error: error.message };
  }
};

// Create User Profile in Firestore
const createUserProfile = async (user, additionalData = {}) => {
  const userRef = doc(db, "users", user.uid);
  
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || additionalData.displayName || "",
    photoURL: user.photoURL || "",
    role: additionalData.role || "student", // Default role
    institutionId: additionalData.institutionId || null,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    ...additionalData
  };
  
  await setDoc(userRef, userData);
  return userData;
};

// Get User Profile
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: "User not found" };
    }
  } catch (error) {
    console.error("Get user profile error:", error);
    return { success: false, error: error.message };
  }
};

// Update User Profile
export const updateUserProfile = async (uid, updateData) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, { 
      ...updateData, 
      updatedAt: new Date().toISOString() 
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Update user profile error:", error);
    return { success: false, error: error.message };
  }
};

// Auth State Listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};