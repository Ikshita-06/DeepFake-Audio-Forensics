import os
import librosa
import soundfile as sf
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import warnings

warnings.filterwarnings('ignore')
print("Initializing Bulletproof Biology Engine...")

def get_original_dataset_paths():
    PA_PROTOCOL = r"D:\Workspace\deepfake_analyser\ASVspoof2019_PA_cm_protocols\ASVspoof2019.PA.cm.train.trn.txt"
    PA_AUDIO_DIR = r"D:\Workspace\deepfake_analyser\ASVspoof2019_PA_train\flac"
    LA_PROTOCOL = r"D:\Workspace\deepfake_analyser\ASVspoof2019_LA_cm_protocols\ASVspoof2019.LA.cm.train.trn.txt"
    LA_AUDIO_DIR = r"D:\Workspace\deepfake_analyser\ASVspoof2019_LA_train\flac"
    
    real_paths, fake_paths = [], []
    
    def parse_protocol(protocol_path, audio_dir, limit=500):
        r_count, f_count = 0, 0
        if not os.path.exists(protocol_path): return
        with open(protocol_path, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) < 5: continue
                audio_path = os.path.join(audio_dir, parts[1] + ".flac")
                if not os.path.exists(audio_path): continue
                
                label = parts[4].lower()
                if label == "bonafide" and r_count < limit:
                    real_paths.append(audio_path)
                    r_count += 1
                elif label == "spoof" and f_count < limit:
                    fake_paths.append(audio_path)
                    f_count += 1
                if r_count >= limit and f_count >= limit: break

    print("Mapping original ASVspoof files...")
    parse_protocol(PA_PROTOCOL, PA_AUDIO_DIR, limit=500)
    parse_protocol(LA_PROTOCOL, LA_AUDIO_DIR, limit=500)
    
    # Grab your custom modern tracks
    for folder, path_list in [("./custom_data/real", real_paths), ("./custom_data/fake", fake_paths)]:
        if os.path.exists(folder):
            for f in os.listdir(folder):
                if f.endswith((".wav", ".mp3", ".flac")) and "PA_Data" not in f and "LA_Data" not in f:
                    path_list.append(os.path.join(folder, f))
                    print(f"🎵 Successfully added your custom track: {f}")
                    
    return real_paths, fake_paths

def extract_mfcc(file_path):
    # 🟢 THE FINAL FIX: Instantly reject physically corrupted/0-byte files
    try:
        if os.path.getsize(file_path) < 1000:
            return None
    except OSError:
        return None

    try:
        safe_path = file_path.replace("\\", "/")
        y, sr = sf.read(safe_path)
        
        if len(y.shape) > 1:
            y = np.mean(y, axis=1)
            
        if sr != 22050:
            y = librosa.resample(y, orig_sr=sr, target_sr=22050)
            sr = 22050

        y = y + 1e-6 * np.random.randn(len(y)) 
        
        target_length = int(sr * 3.0)
        if len(y) > target_length:
            y = y[:target_length]
        elif len(y) < target_length: 
            y = np.pad(y, (0, target_length - len(y)), mode='constant')
            
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
        
        mfcc_mean = np.mean(mfccs.T, axis=0)
        mfcc_std = np.std(mfccs.T, axis=0)
        features = np.hstack((mfcc_mean, mfcc_std))
        
        if np.isnan(features).any() or np.isinf(features).any():
            return None
            
        return features
        
    except Exception:
        # Silently drop unreadable files without spamming the terminal
        return None

X_bio, y_bio = [], []
real_paths, fake_paths = get_original_dataset_paths()

print("Extracting Bio-Features (Filtering out broken downloads)...")
for path in real_paths:
    feat = extract_mfcc(path)
    if feat is not None:
        X_bio.append(feat)
        y_bio.append(0)

for path in fake_paths:
    feat = extract_mfcc(path)
    if feat is not None:
        X_bio.append(feat)
        y_bio.append(1)

X_train, X_test, y_train, y_test = train_test_split(np.array(X_bio), np.array(y_bio), test_size=0.2, random_state=42)

print("Training Random Forest Classifier...")
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)

print(f"RF Accuracy: {accuracy_score(y_test, rf_model.predict(X_test)) * 100:.2f}%")
joblib.dump(rf_model, os.path.join(os.path.dirname(os.path.abspath(__file__)), "deepfake_rf_model.pkl"))
print("✅ Optimized RF Model Saved! (Live Mic Defense Active)")
