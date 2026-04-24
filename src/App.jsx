import React, { useState, useRef } from 'react';
import Groq from 'groq-sdk';
import { Upload, Image as ImageIcon, Sparkles, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const groq = new Groq({ apiKey: GROQ_API_KEY, dangerouslyAllowBrowser: true });

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setError("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Please upload a valid image file.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const generateCaption = async () => {
    if (!preview) return;

    setLoading(true);
    setError("");
    setCaption("");

    try {
      // Extract base64 content
      const base64Data = preview.split(',')[1];

      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Generate a creative and descriptive caption for this image. Keep it engaging and professional." },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
      });

      setCaption(response.choices[0]?.message?.content || "No caption generated.");
    } catch (err) {
      console.error("Groq API Error:", err);
      setError(err.message || "Failed to generate caption. Please check your API key or image size.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h1>Vision Dashboard</h1>
      <p className="subtitle">AI-Powered Image Captioning with Groq</p>

      <div className="dashboard">
        <section className="card">
          <div 
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={(e) => handleFile(e.target.files[0])}
              accept="image/*"
            />
            <div className="upload-icon">
              <Upload size={48} />
            </div>
            <h3>{preview ? 'Change Image' : 'Upload Image'}</h3>
            <p>Drag and drop or click to browse</p>
          </div>

          <AnimatePresence>
            {preview && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="preview-container"
              >
                <img src={preview} alt="Preview" className="preview-image" />
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            className="btn" 
            onClick={generateCaption} 
            disabled={!preview || loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generate Caption
              </>
            )}
          </button>

          {error && (
            <div className="error-msg">
              <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              {error}
            </div>
          )}
        </section>

        <section className="card">
          <div className="caption-header">
            <span>Result</span>
            {caption && (
              <button className="copy-btn" onClick={copyToClipboard}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          <div className="caption-result">
            {loading ? (
              <div className="shimmer-container">
                <div className="loading-shimmer" />
                <div className="loading-shimmer" style={{ width: '80%' }} />
                <div className="loading-shimmer" style={{ width: '90%' }} />
              </div>
            ) : caption ? (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="caption-text"
              >
                {caption}
              </motion.p>
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
                <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Upload an image and click generate to see the AI magic.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ 
          marginTop: '4rem', 
          textAlign: 'center', 
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          borderTop: '1px solid var(--border)',
          paddingTop: '2rem'
        }}
      >
        <p>Powered by <strong>Groq Llama 4 Scout</strong> &bull; Ultra-fast AI Vision</p>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
          <span>100% Privacy &bull; Local Preview</span>
          <span>Instant Captioning</span>
        </div>
      </motion.footer>
    </motion.div>
  );
}

export default App;
