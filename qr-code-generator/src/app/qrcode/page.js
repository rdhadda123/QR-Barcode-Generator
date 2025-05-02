"use client";

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../supabase'; 
import styles from '../../../styles/Saved.module.css';
import Navbar from '../components/NavBar';

const QRcode = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserAndCodes = async () => {
      setIsLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setUser(null);
        setSavedItems([]);
        setIsLoading(false);
        return;
      }

      setUser(user);

      const { data, error } = await supabase
          .from('QRCodes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching saved codes from Supabase:", error);
        setSavedItems([]);
      } else {
        setSavedItems(data || []);
      }

      setIsLoading(false);
    };

    fetchUserAndCodes();
  }, []);

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('QRCodes').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete QR code:', error);
      alert('Failed to delete QR code.');
    } else {
      setSavedItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div>
      <Navbar></Navbar>
      <div className={styles.container}>
        <Head>
          <title>Saved Codes</title>
          <meta name="description" content="View your saved QR codes and barcodes" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          <div className={styles.header}>
            <h1 className={styles.title}>My Saved Codes</h1>
          </div>

          {isLoading ? (
              <p>Loading saved codes...</p>
          ) : !user ? (
              <p className="text-red-500 text-center">Please log in to view your saved codes.</p>
          ) : savedItems.length > 0 ? (
              <ul className={styles.list}>
                {savedItems.map((item) => (
                    <li key={item.id} className={styles.listItem} style={{ position: 'relative' }}>
                      <button
                          onClick={() => handleDelete(item.id)}
                          className={styles.deleteText}
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                          aria-label={`Delete ${item.text}`}
                      >
                        Delete
                      </button>


                      <div className={styles.imageContainer}>
                        {item.data_url ? (
                            <img
                                src={item.data_url}
                                alt={`${item.type} for ${item.text}`}
                                className={styles.codeImage}
                            />
                        ) : (
                            <div className={styles.noImage}>No Image Data</div>
                        )}
                      </div>
                      <div className={styles.details}>
                        <p><strong>Text:</strong> {item.text || 'N/A'}</p>
                        <p><strong>Type:</strong> {item.type || 'N/A'}</p>
                        <p><strong>Saved:</strong> {formatTimestamp(item.created_at)}</p>
                      </div>
                    </li>
                ))}
              </ul>
          ) : (
              <p className={styles.emptyMessage}>You haven't saved any codes yet.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default QRcode;
