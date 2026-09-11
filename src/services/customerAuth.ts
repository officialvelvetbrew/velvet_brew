import { useState, useEffect } from "react";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, type User } from "firebase/auth";
import { auth } from "../firebase/firebase";

const provider = new GoogleAuthProvider();

export function useCustomerAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Both admins and customers share the same Firebase Auth.
      // This hook simply exposes the current Firebase user for the customer-facing frontend.
      setUser(currentUser);
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
