'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import styles from '../../styles/Home.module.css'
import Link from 'next/link';
import NavBar from './components/NavBar';
import {supabase} from "@/supabase";

const barcodeTypes = [
  'CODE128',
  'CODE39',
  'EAN13',
  'EAN8',
  'UPC',
  'ITF',
  'MSI',
  'pharmacode',
  'codabar',
];

const Home = () => {

  const [inputText, setInputText] = useState('');
  const [codeType, setCodeType] = useState('qrcode'); 
  const [generatedCodeDataUrl, setGeneratedCodeDataUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isGenerated, setIsGenerated] = useState(false);

  const canvasRef = useRef(null);
  //"The specific JavaScript libraries we're using (qrcode and jsbarcode) are designed 
  //to render the QR codes and barcodes visually. They work by taking your input 
  //text and the canvas element as arguments, and then they programmatically draw the 
  //pixels, lines, and patterns that make up the code directly onto that canvas surface."
  const [user, setUser] = useState(null);

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
      listener?.subscription.unsubscribe();
    };
  }, []);

  const generateCode = useCallback(() => {
    setError(null);
    setGeneratedCodeDataUrl(null);
    setIsGenerated(false);

    if (!inputText.trim()) {
      setError('Input text cannot be empty.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      setError('Canvas element not found.');
      return;
    }

    const context = canvas.getContext('2d');
     if (!context) {
      setError('Could not get canvas context.');
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);


    try {
      if (codeType === 'qrcode') {
        QRCode.toCanvas(canvas, inputText, { errorCorrectionLevel: 'M', width: 256 })
          .then(() => {
            setGeneratedCodeDataUrl(canvas.toDataURL('image/png'));
            setIsGenerated(true);
          })
          .catch((err) => { 
            console.error('QR Code Generation Error:', err);
            setError(`Failed to generate QR Code: ${err.message}`);
            setIsGenerated(false);
          });
      } else {
        JsBarcode(canvas, inputText, {
          format: codeType,
          displayValue: true,
          fontSize: 16,
          margin: 10,
          width: 2,
          height: 100,
        });

         setTimeout(() => {
            const dataUrl = canvas.toDataURL('image/png');
            if (!isCanvasBlank(canvas)) {
                 setGeneratedCodeDataUrl(dataUrl);
                 setIsGenerated(true);
            } else {
                 setError(`Failed to generate ${codeType}. Input may be invalid for this format.`);
                 setIsGenerated(false);
                 context.clearRect(0, 0, canvas.width, canvas.height);
            }
         }, 50);

      }
    } catch (err) {
      console.error('Barcode Generation Error:', err);
      setError(`Failed to generate ${codeType}: ${err.message}. Input may be invalid.`);
      setIsGenerated(false);
       const ctx = canvas.getContext('2d');
       if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
       }
    }
  }, [inputText, codeType]);

   const isCanvasBlank = (canvas) => {
    const context = canvas.getContext('2d');
    if (!context) return true;
    const pixelBuffer = new Uint32Array(
      context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    return !pixelBuffer.some(pixel => pixel !== 0);
  };

  const handleDownload = () => {
    if (!generatedCodeDataUrl || !canvasRef.current) return;

    const link = document.createElement('a');
    link.href = generatedCodeDataUrl;
    const fileExtension = 'png'; 
    const filename = `${codeType}_${inputText.substring(0, 20).replace(/[^a-z0-9]/gi, '_')}.${fileExtension}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!generatedCodeDataUrl || !navigator.share) {
      alert('Web Share API not supported in your browser, or no code generated yet.');
      return;
    }

    try {
       const response = await fetch(generatedCodeDataUrl);
      //A Blob represents raw, immutable data. Think of it as a file-like object
      // holding binary data (in this case, the binary data of the PNG image 
      //that was encoded in the Base64 Data URL). It has a size property (in bytes) 
      //and a type property (the MIME type, like image/png).
       const blob = await response.blob(); // This remains the same
       const file = new File([blob], `generated_${codeType}.png`, { type: blob.type }); // This remains the same

      await navigator.share({
        title: `Generated ${codeType}`,
        text: `Code generated for: ${inputText}`,
        files: [file],
      });
      console.log('Shared successfully');
    } catch (err) { 
      console.error('Share failed:', err);
      if (err.name !== 'AbortError') {
           alert(`Could not share: ${err.message}`);
      }
    }
  };

  const handleSave = async () => {
    if (!generatedCodeDataUrl) {
        alert('No code generated to save.');
        return;
    }

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        alert('You must be logged in to save codes');
        return;
    }

    try {
        // Check if QR code already exists for this user
        const { data: existingCodes, error: selectError } = await supabase
            .from('QRCodes')
            .select('id')
            .eq('user_id', user.id)
            .eq('text', inputText)
            .eq('type', codeType);

        if (selectError) {
            console.error('Supabase select error:', selectError);
            alert('Failed to check for existing code.');
            return;
        }

        if (existingCodes && existingCodes.length > 0) {
            alert('Code already saved');
            return;
        }

        const { error: insertError } = await supabase.from('QRCodes').insert([
            {
                user_id: user.id,
                text: inputText,
                type: codeType,
                data_url: generatedCodeDataUrl,
            },
        ]);

        if (insertError) {
            console.error('Supabase insert error:', insertError);
            alert('Failed to save code to Supabase.');
        } else {
            alert('Code saved to your Supabase account!');
        }
    } catch (err) {
        console.error('Unexpected error saving to Supabase:', err);
        alert('Unexpected error saving code.');
    }
};





    return (
    <div>
      <NavBar></NavBar>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-sky-900">
          {!user && (
            <>
              <div className="text-2xl font-semibold mt-2 mb-4">Welcome to QR Code Generator!</div>
              <div className="text-lg text-center mb-2 px-4">Login/Sign Up to save your created QR/Barcodes and access them whenever you desire!</div>
            </>
          )}
          <main className={styles.main}>
        <h1 className={styles.title}>QR & Barcode Generator</h1>

        <div className={styles.inputSection}>
        <label htmlFor="text-input-area" >
                Enter Text or URL:
          </label>
          <textarea
          id = "text-input-area"
            className={styles.textarea}
            placeholder="e.g., https://example.com or 'My Text'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
          />

          <div className={styles.controls}>
          <label htmlFor="code-option" className={styles.visuallyHidden}>
                  Type of Generation
              </label>
            <select id="code-option"
              className={styles.select}
              value={codeType}
              onChange={(e) => setCodeType(e.target.value)}
            >
              <option value="qrcode">QR Code</option>
              <optgroup label="Barcodes">
                {barcodeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </optgroup>
            </select>

            <button className={styles.button} onClick={generateCode}>
              Generate
            </button>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.outputSection}>
        <label htmlFor="generated-code-canvas">Generated Code:</label>
          <div className={styles.canvasContainer}>
             <canvas id="generated-code-canvas"
                  ref={canvasRef}
                  className={styles.canvas}
                  width={codeType === 'qrcode' ? 256 : 300}
                  height={codeType === 'qrcode' ? 256 : 150}
              ></canvas>
             {!isGenerated && <div className={styles.placeholder}>Your code will appear here</div>}
          </div>

          {isGenerated && generatedCodeDataUrl && (
            <div className={styles.actions}>
              <button className={styles.buttonAction} onClick={handleDownload}>
                Download (.png)
              </button>
              {navigator.share && (
                 <button className={styles.buttonAction} onClick={handleShare}>
                    Share
                 </button>
              )}
               <button className={styles.buttonAction} onClick={handleSave}>
                 Save
               </button>
            </div>
          )}
        </div>
      </main>
        </div>
    </div>
  );
};

export default Home;