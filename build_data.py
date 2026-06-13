import os
import shutil

# ==========================================
# 📂 1. PATH CONFIGURATIONS (UPDATE THESE!)
# ==========================================
# PA (Replay Attacks & Room Echo)
PA_PROTOCOL = r"D:\Workspace\deepfake_analyser\ASVspoof2019_PA_cm_protocols\ASVspoof2019.PA.cm.train.trn.txt"
PA_AUDIO_DIR = r"D:\Workspace\deepfake_analyser\ASVspoof2019_PA_train\flac"

# LA (Digital AI Fakes & Clean Voices)
LA_PROTOCOL = r"D:\Workspace\deepfake_analyser\ASVspoof2019_LA_cm_protocols\ASVspoof2019.LA.cm.train.trn.txt"
LA_AUDIO_DIR = r"D:\Workspace\deepfake_analyser\ASVspoof2019_LA_train\flac"

REAL_DIR = "./custom_data/real"
FAKE_DIR = "./custom_data/fake"

# ==========================================
# ⚙️ 2. THE EXTRACTOR LOGIC
# ==========================================
def extract_data(protocol_path, audio_dir, dataset_name, limit_per_class=500):
    real_count = 0
    fake_count = 0
    
    print(f"\nProcessing {dataset_name} Dataset...")
    
    try:
        with open(protocol_path, 'r') as file:
            lines = file.readlines()
            
        for line in lines:
            parts = line.strip().split()
            if len(parts) < 5: continue
                
            audio_filename = parts[1] + ".flac"
            label = parts[4].lower() # 'bonafide' or 'spoof'
            source_path = os.path.join(audio_dir, audio_filename)
            
            if not os.path.exists(source_path): continue
                
            # Route Real Audio
            if label == "bonafide" and real_count < limit_per_class:
                shutil.copy(source_path, os.path.join(REAL_DIR, f"{dataset_name}_real_{audio_filename}"))
                real_count += 1
                
            # Route Fake Audio
            elif label == "spoof" and fake_count < limit_per_class:
                shutil.copy(source_path, os.path.join(FAKE_DIR, f"{dataset_name}_fake_{audio_filename}"))
                fake_count += 1
                
            if real_count >= limit_per_class and fake_count >= limit_per_class:
                break
                
        print(f"✅ {dataset_name}: Added {real_count} real and {fake_count} fake tracks.")
        
    except FileNotFoundError:
        print(f"❌ Error: Could not find files for {dataset_name}. Check your paths!")

if __name__ == "__main__":
    # We pull 500 of each type. Total dataset will be 2000 files.
    # (500 LA Real + 500 PA Real) vs (500 LA Fake + 500 PA Fake)
    extract_data(PA_PROTOCOL, PA_AUDIO_DIR, "PA_Data", limit_per_class=500)
    extract_data(LA_PROTOCOL, LA_AUDIO_DIR, "LA_Data", limit_per_class=500)
    print("\n🎉 Automated extraction complete! Now add your custom tracks.")