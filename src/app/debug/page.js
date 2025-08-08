"use client";
import { useEffect, useState } from "react";
import { getUserProfile } from "../../lib/database";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function DebugPage() {
  const [results, setResults] = useState({});
  const [email, setEmail] = useState("aditya.122140235@student.itera.ac.id");

  const testEmailConversion = () => {
    const emailBasedId = email.replace(/[^a-zA-Z0-9]/g, '_');
    setResults(prev => ({
      ...prev,
      emailConversion: {
        original: email,
        converted: emailBasedId
      }
    }));
    return emailBasedId;
  };

  const testInvitationLookup = async () => {
    const emailBasedId = testEmailConversion();
    console.log("Looking up invitation for:", emailBasedId);
    
    const result = await getUserProfile(emailBasedId);
    console.log("Invitation lookup result:", result);
    
    setResults(prev => ({
      ...prev,
      invitationLookup: result
    }));
  };

  const testUidLookup = async () => {
    const uid = "BgXIYQaXnuPgp2JTAep2lXjvQPj1"; // The user's actual UID
    console.log("Looking up user by UID:", uid);
    
    const result = await getUserProfile(uid);
    console.log("UID lookup result:", result);
    
    setResults(prev => ({
      ...prev,
      uidLookup: result
    }));
  };

  const listAllUsers = async () => {
    try {
      console.log("Fetching all users from Firestore...");
      const usersSnapshot = await getDocs(collection(db, "users"));
      const allUsers = [];
      
      usersSnapshot.forEach((doc) => {
        allUsers.push({ id: doc.id, ...doc.data() });
      });
      
      console.log("All users in database:", allUsers);
      
      setResults(prev => ({
        ...prev,
        allUsers: allUsers
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      setResults(prev => ({
        ...prev,
        allUsers: { error: error.message }
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug User Invitation System</h1>
        
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Email Input</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Enter email to test"
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Tests</h2>
            <div className="space-y-4">
              <button
                onClick={testEmailConversion}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg mr-4"
              >
                Test Email Conversion
              </button>
              <button
                onClick={testInvitationLookup}
                className="bg-green-600 text-white px-4 py-2 rounded-lg mr-4"
              >
                Test Invitation Lookup
              </button>
              <button
                onClick={testUidLookup}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg mr-4"
              >
                Test UID Lookup
              </button>
              <button
                onClick={listAllUsers}
                className="bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                List All Users
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <pre className="bg-slate-100 p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}