"use client"
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { useRouter } from "next/navigation";


export default function Navbar() {
    const [user, setUser] = useState(null);
    const router = useRouter();
  
    useEffect(() => {
      const getSession = async () => {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
        }
      };
  
      getSession();
  
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });
  
      return () => {
        listener.subscription.unsubscribe();
      };
    }, []);
  
    const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push("/login");
    };
  
    return (
      <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-sky-900">
          QR Link Generator
        </Link>
        <div className="space-x-4">
          <Link href="/" className="text-sky-900 hover:underline">
            Home
          </Link>
          <Link href="/qrcode" className="text-sky-900 hover:underline">
            My Codes
          </Link>
          {user ? (
            <>
              <span className="text-gray-800">Hello, {user.email}</span>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:underline cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sky-900 hover:underline">
              Login / Sign Up
            </Link>
          )}
        </div>
      </nav>
    );
  }