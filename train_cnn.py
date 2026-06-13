import os
import librosa
import soundfile as sf
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from sklearn.model_selection import train_test_split

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
print("Initializing Bulletproof Physics Engine...")

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

def extract_spectrogram(file_path, max_pad_len=130):
    # 🟢 SILENT FILTER: Instantly reject physically corrupted/0-byte files
    try:
        if os.path.getsize(file_path) < 1000:
            return None
    except OSError:
        return None

    try:
        safe_path = file_path.replace("\\", "/")
        y, sr = sf.read(safe_path)
        
        # Convert stereo to mono if necessary
        if len(y.shape) > 1:
            y = np.mean(y, axis=1)
            
        # Standardize sample rate
        if sr != 22050:
            y = librosa.resample(y, orig_sr=sr, target_sr=22050)
            sr = 22050

        # Inject mathematical epsilon to prevent NaN silence crashes
        y = y + 1e-6 * np.random.randn(len(y)) 
        
        # Enforce exact 3-second duration
        target_length = int(sr * 3.0)
        if len(y) > target_length:
            y = y[:target_length]
        elif len(y) < target_length: 
            y = np.pad(y, (0, target_length - len(y)), mode='constant')

        # Full-Spectrum Mel Spectrogram (No frequency cap)
        mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128)
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
        
        if mel_spec_db.shape[1] < max_pad_len:
            mel_spec_db = np.pad(mel_spec_db, ((0,0), (0, max_pad_len - mel_spec_db.shape[1])), mode='constant')
        else:
            mel_spec_db = mel_spec_db[:, :max_pad_len]
            
        return mel_spec_db.reshape(128, max_pad_len, 1)
        
    except Exception:
        # Silently drop unreadable files without spamming the terminal
        return None

X_phys, y_phys = [], []
real_paths, fake_paths = get_original_dataset_paths()

print("Extracting Full-Spectrum Spectrograms (Filtering out broken downloads)...")
# This might take a few minutes as Spectrograms are heavy matrices!
for path in real_paths:
    spec = extract_spectrogram(path)
    if spec is not None:
        X_phys.append(spec)
        y_phys.append(0)

for path in fake_paths:
    spec = extract_spectrogram(path)
    if spec is not None:
        X_phys.append(spec)
        y_phys.append(1)

X_train, X_test, y_train, y_test = train_test_split(np.array(X_phys), np.array(y_phys), test_size=0.2, random_state=42)

print("Constructing CNN Engine...")
model = models.Sequential([
    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(128, 130, 1)),
    layers.MaxPooling2D((2, 2)),
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.Flatten(),
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(1, activation='sigmoid') 
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# Train the model (10 epochs is standard)
model.fit(X_train, y_train, epochs=10, validation_data=(X_test, y_test))

model.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'deepfake_cnn_model.h5'))
print("✅ Optimized CNN Model Saved! (Full-Spectrum Hardware Detection Active)")