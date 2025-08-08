"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChange } from "../lib/auth";
import { getUserProfile, updateUserProfile } from "../lib/database";
import { initializeSuperAdmin } from "../lib/initSuperAdmin";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Show UI faster with basic info
        if (initialLoad) {
          setLoading(false);
          setInitialLoad(false);
        }
        
        // Initialize SuperAdmin for first-time login
        const superAdminEmails = [
          "superadmin@nfticate.com",
          "wahyusuhendaraditya@gmail.com"  // Backup admin
        ];
        
        if (superAdminEmails.includes(firebaseUser.email)) {
          try {
            const initResult = await initializeSuperAdmin(firebaseUser);
            if (initResult.success) {
              setUserProfile(initResult.data);
            } else {
              console.error("SuperAdmin init failed:", initResult.error);
              // Fallback to basic profile
              setUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                role: "superadmin"
              });
            }
          } catch (error) {
            console.error("SuperAdmin init error:", error);
            setUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: "superadmin"
            });
          }
        } else {
          console.log("Processing non-superadmin user:", firebaseUser.email);
          
          // Get user profile from Firestore for other users
          let profileResult = await getUserProfile(firebaseUser.uid);
          console.log("Profile lookup by UID result:", profileResult);
          
          if (profileResult.success) {
            console.log("Found existing profile:", profileResult.data);
            setUserProfile(profileResult.data);
          } else {
            // Check if user was invited by email
            const emailBasedId = firebaseUser.email.replace(/[^a-zA-Z0-9]/g, '_');
            console.log("Checking for invitation with email-based ID:", emailBasedId);
            
            const inviteResult = await getUserProfile(emailBasedId);
            console.log("Invitation lookup result:", inviteResult);
            
            if (inviteResult.success) {
              console.log("Found invitation! Original data:", inviteResult.data);
              
              // User was invited! Update their profile with proper UID
              const invitedProfile = {
                ...inviteResult.data,
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || inviteResult.data.displayName,
                photoURL: firebaseUser.photoURL || "",
                lastLoginAt: new Date().toISOString()
              };
              
              console.log("Updating profile with:", invitedProfile);
              
              // Save with proper UID
              const updateResult = await updateUserProfile(firebaseUser.uid, invitedProfile);
              console.log("Profile update result:", updateResult);
              
              if (updateResult.success) {
                setUserProfile(invitedProfile);
                console.log("Profile successfully updated and set:", invitedProfile);
              } else {
                console.error("Failed to update user profile:", updateResult.error);
                setUserProfile(invitedProfile); // Set anyway for now
              }
            } else {
              console.log("No invitation found, creating new user profile");
              
              // New user, no invitation
              const newUserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                role: "student",
                organizationId: null,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
              };
              
              const createResult = await updateUserProfile(firebaseUser.uid, newUserProfile);
              console.log("New user profile creation result:", createResult);
              
              setUserProfile(newUserProfile);
              console.log("New user profile created:", newUserProfile);
            }
          }
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    isAdmin: userProfile?.role === "admin",
    isSuperAdmin: userProfile?.role === "superadmin",
    isStudent: userProfile?.role === "student",
    hasBasicAuth: !!user && !loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};