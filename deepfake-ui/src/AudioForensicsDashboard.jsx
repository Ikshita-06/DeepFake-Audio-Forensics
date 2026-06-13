import React, { useState, useEffect, useRef } from 'react';

export default function AudioForensicsDashboard() {
  const [fileAttached, setFileAttached] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null); 
  const [analysisData, setAnalysisData] = useState(null); 
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loadingAnimation, setLoadingAnimation] = useState(Array(30).fill(12));
  
  const fileInputRef = useRef(null);
  const audioPlayerRef = useRef(new Audio()); 
  const canvasRef = useRef(null);

  // ==========================================
  // REAL WAVEFORM DRAWER (HTML5 Canvas)
  // ==========================================
  useEffect(() => {
    if (!audioUrl || !canvasRef.current) return;

    const drawWaveform = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const channelData = audioBuffer.getChannelData(0); 
        const step = Math.ceil(channelData.length / width);
        const amp = height / 2;

        ctx.fillStyle = '#38bdf8'; 
        
        for (let i = 0; i < width; i++) {
          let min = 1.0;
          let max = -1.0;
          for (let j = 0; j < step; j++) {
            const datum = channelData[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }
          ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }
      } catch (err) {
        console.error("Error drawing waveform:", err);
      }
    };
    drawWaveform();
  }, [audioUrl, analysisData]);

  // ==========================================
  // AUDIO PLAYBACK SYNC
  // ==========================================
  useEffect(() => {
    const audio = audioPlayerRef.current;
    const updateTime = () => {
      if (audio.duration) setPlaybackTime((audio.currentTime / audio.duration) * 100);
    };
    const handleEnd = () => {
      setIsPlaying(false);
      setPlaybackTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnd);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnd);
    };
  }, []);

  const togglePlayback = () => {
    if (!audioUrl) return;
    const audio = audioPlayerRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    let interval;
    if (isAnalyzing || isPlaying) {
      interval = setInterval(() => setLoadingAnimation(prev => prev.map(() => Math.floor(Math.random() * 45) + 5)), 100);
    } else {
      setLoadingAnimation(Array(30).fill(12));
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, isPlaying]);

  // ==========================================
  // SERVER BRIDGE
  // ==========================================
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileAttached({ name: file.name });
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      audioPlayerRef.current.src = url;
      setAnalysisData(null);
      setSelectedLog(null);
      sendToPythonEngine(file);
    }
  };

  const sendToPythonEngine = async (audioFile) => {
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      
      if (data.status === "success") {
        setAnalysisData(data.payload);
      } else {
        alert("Server Error: " + data.message);
      }
    } catch (error) {
      alert("Could not connect to Python Server. Ensure uvicorn is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', backgroundColor: '#0b0f19', color: '#f3f4f6', padding: '32px' }}>
      
      <div style={{ borderBottom: '1px solid #1f2937', paddingBottom: '20px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0', color: '#ffffff' }}>🛡️ Audio Deepfake Forensic Terminal</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px', alignItems: 'start' }}>
        
        {/* LEFT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Audio Intake Panel
            </h2>

            <input type="file" accept=".wav, .flac, audio/wav, audio/flac" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

            <div onClick={() => !isAnalyzing && fileInputRef.current.click()} style={{ border: '2px dashed #374151', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', backgroundColor: '#1f2937', cursor: isAnalyzing ? 'not-allowed' : 'pointer', transition: 'border-color 0.2s ease', marginBottom: '16px', opacity: isAnalyzing ? 0.5 : 1 }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
              <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#ffffff' }}>Upload Target Audio File</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Supports pristine uncompressed .wav or .flac</p>
            </div>
          </div>

          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#9ca3af', margin: '0 0 16px 0', textTransform: 'uppercase' }}>
              System Status
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', height: '60px', backgroundColor: '#030712', borderRadius: '12px', padding: '0 16px' }}>
              {loadingAnimation.map((height, i) => (
                <div key={i} style={{ width: '6px', height: `${height}%`, backgroundColor: isAnalyzing ? '#eab308' : '#4b5563', borderRadius: '3px', transition: 'height 0.1s ease' }} />
              ))}
            </div>

            {fileAttached ? (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#1f2937', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {fileAttached.name}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                  {isAnalyzing ? "Processing neural arrays..." : "Status: Ready for Inspection"}
                </div>
              </div>
            ) : (
               <div style={{ marginTop: '16px', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
                  Awaiting file input...
               </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        {!analysisData && !isAnalyzing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', border: '2px dashed #1f2937', borderRadius: '16px', padding: '40px', color: '#6b7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📡</div>
            <h3 style={{ margin: 0, color: '#9ca3af' }}>Awaiting Audio Input</h3>
          </div>
        ) : isAnalyzing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #1f2937', color: '#eab308' }}>
            <div style={{ fontSize: '48px', animation: 'spin 2s linear infinite', marginBottom: '16px' }}>⚙️</div>
            <h3 style={{ margin: 0 }}>Processing sliding neural window...</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>Classification Output</span>
                  <h2 style={{ fontSize: '28px', fontWeight: '900', color: analysisData.verdict === "Real Human" ? '#10b981' : '#ef4444', margin: '4px 0 0 0' }}>{analysisData.verdict}</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Confidence</span>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: '#3b82f6', display: 'block' }}>{analysisData.confidence}%</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 12px 0' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#9ca3af' }}>Forensic Waveform Breakdown</span>
                <button onClick={togglePlayback} disabled={!audioUrl} style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', backgroundColor: isPlaying ? '#ef4444' : '#10b981', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isPlaying ? "⏸️ Pause" : "▶️ Play Audio"}
                </button>
              </div>

              {/* REAL WAVEFORM CONTAINER */}
              <div style={{ position: 'relative', height: '120px', backgroundColor: '#030712', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1f2937' }}>
                
                <canvas ref={canvasRef} width="800" height="120" style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, opacity: 0.6 }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${playbackTime}%`, width: '2px', backgroundColor: '#ffffff', zIndex: 20, pointerEvents: 'none' }} />
                
                <div style={{ display: 'flex', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
                  {analysisData.segments.map((seg, idx) => {
                    const leftPos = (seg.start / analysisData.duration) * 100;
                    const widthPercent = ((seg.end - seg.start) / analysisData.duration) * 100;
                    
                    return (
                      <div key={idx} onClick={() => setSelectedLog(seg)} 
                           style={{ position: 'absolute', left: `${leftPos}%`, width: `${widthPercent}%`, height: '100%', 
                                    backgroundColor: seg.type === 'human' ? '#10b981' : '#ef4444', 
                                    opacity: selectedLog === seg ? 0.6 : 0.25, cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '10px', fontWeight: 'bold', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.8)', padding: '2px 4px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                          {seg.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedLog && (
                <div style={{ marginTop: '16px', backgroundColor: '#1f2937', borderRadius: '8px', padding: '14px', borderLeft: `4px solid ${selectedLog.type === 'human' ? '#10b981' : '#ef4444'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: '#ffffff' }}>Inspector Segment: {selectedLog.label}</strong>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#9ca3af' }}>{selectedLog.start.toFixed(2)}s - {selectedLog.end.toFixed(2)}s</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>{selectedLog.details || "No anomaly detected."}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {analysisData.metrics.map((metric, i) => (
                <div key={i} style={{ backgroundColor: '#111827', border: `1px solid #1f2937`, borderTop: `4px solid ${metric.color}`, borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ fontWeight: '700', fontSize: '14px', color: '#f3f4f6', margin: 0 }}>{metric.title}</h3>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: metric.color }}>{metric.status}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }}>{metric.desc}</p>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}