"use client"
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link'; 
import styles from '../../../styles/Saved.module.css'; 

const QRcode = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  //(client-side only)
  useEffect(() => {
    setIsLoading(true);
    try {
      const itemsJson = localStorage.getItem('savedCodes');
      const items = itemsJson ? JSON.parse(itemsJson) : [];
      setSavedItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Error parsing saved codes from localStorage:", error);
      setSavedItems([]); 
    } finally {
      setIsLoading(false); 
    }
  }, []);

  const handleDelete = (idToDelete) => {
    const updatedItems = savedItems.filter(item => item.id !== idToDelete);
    setSavedItems(updatedItems);
    localStorage.setItem('savedCodes', JSON.stringify(updatedItems));
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all saved codes? This cannot be undone.')) {
      setSavedItems([]);
      localStorage.removeItem('savedCodes'); 
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleString(); // Adjust format as needed
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
            <h1 className={styles.title}>Saved Codes</h1>
            <Link href="/" className={styles.backLink}>
                ← Back to Generator
            </Link>
        </div>


        {isLoading ? (
          <p>Loading saved codes...</p>
        ) : savedItems.length > 0 ? (
          <>
            <button
              onClick={handleClearAll}
              className={`${styles.button} ${styles.clearAllButton}`}
            >
              Clear All Saved Codes
            </button>
            <ul className={styles.list}>
              {savedItems.map((item) => (
                <li key={item.id} className={styles.listItem}>
                  <div className={styles.imageContainer}>
                     {item.dataUrl ? (
                         <img
                           src={item.dataUrl}
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
                    <p><strong>Saved:</strong> {formatTimestamp(item.timestamp)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className={`${styles.button} ${styles.deleteButton}`}
                    aria-label={`Delete code for ${item.text}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className={styles.emptyMessage}>You haven't saved any codes yet.</p>
        )}
      </main>
    </div>
  );
};

export default QRcode;