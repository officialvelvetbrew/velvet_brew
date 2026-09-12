import { useState, useEffect } from "react";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, type User } from "firebase/auth";
import { auth } from "../firebase/firebase";

const provider = new GoogleAuthProvider();


export function useCustomerAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        let token = localStorage.getItem("vb_customer_token");
        if (!token) {
          try {
            const firebaseToken = await currentUser.getIdToken();
            // Use the environment variable for API base
            const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "https://api.velvetbrew.in/api/v1";
            const pendingPhone = localStorage.getItem("vb_pending_phone");
            const exchangeRes = await fetch(`${baseUrl}/auth/firebase`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                token: firebaseToken,
                idToken: firebaseToken,
                firebaseToken: firebaseToken,
                credential: firebaseToken,
                mobile: pendingPhone || "",
                phone: pendingPhone || "",
                phoneNumber: pendingPhone || ""
              })
            });
            
            // Clean up pending phone regardless of outcome
            localStorage.removeItem("vb_pending_phone");
            
            if (exchangeRes.ok) {
              const data = await exchangeRes.json();
              token = data?.data?.token || data?.token;
              if (token) {
                localStorage.setItem("vb_customer_token", token);
              }
            }
          } catch (e) {
            console.error("Failed to exchange Firebase token on load", e);
          }
        }
      } else {
        localStorage.removeItem("vb_customer_token");
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
}

export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, provider);
    localStorage.removeItem("vb_customer_token");
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
}

export async function logoutCustomer(): Promise<void> {
  try {
    await signOut(auth);
    localStorage.removeItem("vb_customer_token");
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
}
