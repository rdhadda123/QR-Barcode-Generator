"use client"
import Link from 'next/link';
import NavBar from './components/NavBar';

export default function QRcode() {
  return (
    <div>
      <NavBar></NavBar>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-blue-500">
          <div>Welcome to QR Code Generator!</div>
          <div>Login/Sign Up to continue!</div>
        </div>
    </div>
  );
}
