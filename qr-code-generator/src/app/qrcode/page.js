"use client";

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../supabase'; // adjust if needed
import styles from '../../../styles/Saved.module.css';

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

  return (
      <div className={styles.container}>
        <Head>
          <title>Saved Codes</title>
          <meta name="description" content="View your saved QR codes and barcodes" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          <div className={styles.header}>
            <h1 className={styles.title}>My Saved Codes</h1>
            <Link href="/" className={styles.backLink}>
              ← Back to Generator
            </Link>
          </div>

          {isLoading ? (
              <p>Loading saved codes...</p>
          ) : !user ? (
              <p className="text-red-500 text-center">Please log in to view your saved codes.</p>
          ) : savedItems.length > 0 ? (
              <ul className={styles.list}>
                {savedItems.map((item) => (
                    <li key={item.id} className={styles.listItem}>
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
  );
};

export default QRcode;
