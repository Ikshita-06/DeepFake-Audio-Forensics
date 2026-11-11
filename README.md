# DeepFake Audio Forensics

A machine learning-based audio analysis system designed to identify potential AI-generated speech and audio manipulation using two complementary classification models.

## Overview

The project combines traditional machine learning and deep learning approaches to analyze audio recordings and identify patterns associated with synthetic audio.

It uses a dual-model architecture, where a Random Forest classifier and a Convolutional Neural Network (CNN) independently analyze extracted audio features.

## Key Features

- **Dual-Model Detection:** Combines Random Forest and CNN-based classification.
- **MFCC Feature Extraction:** Extracts 40 MFCC coefficients and their statistical features for Random Forest classification.
- **Spectrogram Analysis:** Uses Mel spectrograms as CNN input to identify audio patterns.
- **Segment-Based Analysis:** Processes audio in overlapping 3-second windows to identify potentially suspicious segments.
- **Timestamp-Based Results:** Provides segment-level analysis information for visualizing detected anomalies.
- **Web Interface:** Provides an interface for uploading audio and viewing analysis results.

## System Architecture

The application consists of two classification pipelines:

### 1. Random Forest Classifier

- Extracts 40 MFCC coefficients from audio.
- Calculates mean and standard deviation for each coefficient.
- Produces an 80-dimensional feature vector.
- Uses the extracted features for classification.

### 2. Convolutional Neural Network (CNN)

- Generates 128-band Mel spectrograms from audio.
- Converts spectrograms into fixed-size input representations.
- Uses convolutional layers to learn patterns from the spectrograms.
- Produces a classification score using a sigmoid output layer.

## Audio Processing Pipeline

1. **Audio Input:** Receives an audio recording through the application.
2. **Preprocessing:** Loads and standardizes audio to a 22,050 Hz sample rate.
3. **Segmentation:** Divides audio into overlapping 3-second windows.
4. **Feature Extraction:** Generates MFCC features and Mel spectrograms.
5. **Model Inference:** Passes extracted features through the Random Forest and CNN models.
6. **Classification:** Applies model-specific thresholds to identify potentially synthetic segments.
7. **Results:** Returns the classification, confidence score, and segment-level analysis.

## Technology Stack

| Component | Technologies |
|---|---|
| Programming Language | Python |
| Backend API | FastAPI |
| Frontend | React, Vite |
| Machine Learning | Scikit-learn |
| Deep Learning | TensorFlow, Keras |
| Audio Processing | Librosa, NumPy |
| Feature Extraction | MFCC, Mel Spectrograms |
| Model Storage | Joblib, HDF5 |

## Project Structure

```text
DeepFake-Audio-Forensics/
│
├── deepfake-ui/              # React frontend
│
├── server.py                 # FastAPI backend
├── build_data.py             # Data preparation
├── train_cnn.py              # CNN training pipeline
├── train_rf.py               # Random Forest training pipeline
│
├── deepfake_cnn_model.h5     # Trained CNN model
├── deepfake_rf_model.pkl     # Trained Random Forest model
│
└── README.md
```

## Running the Application

### Prerequisites

- Python
- Node.js and npm

### 1. Clone the Repository

```bash
git clone https://github.com/Ikshita-06/DeepFake-Audio-Forensics.git
cd DeepFake-Audio-Forensics
```

### 2. Set Up the Backend

Create and activate a virtual environment:

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Install the required Python packages:

```bash
pip install fastapi uvicorn python-multipart librosa numpy joblib tensorflow scikit-learn
```

Start the backend:

```bash
uvicorn server:app --reload
```

### 3. Set Up the Frontend

Open another terminal:

```bash
cd deepfake-ui
npm install
npm run dev
```

Open the local development URL displayed by Vite in your browser.

## Model Training

The repository includes separate training pipelines:

- `train_cnn.py` — Trains the CNN using Mel spectrogram representations.
- `train_rf.py` — Trains the Random Forest classifier using extracted MFCC features.
- `build_data.py` — Supports dataset preparation.

The training pipeline uses the ASVspoof 2019 dataset along with optional custom audio samples.

The trained models are saved as:

- `deepfake_cnn_model.h5`
- `deepfake_rf_model.pkl`

## 🔍 Visualizing the Deepfake Analysis
<img width="1128" height="635" alt="WhatsApp Image 2026-06-13 at 11 32 33 PM" src="https://github.com/user-attachments/assets/b7b107ab-4a29-4c96-86a2-089520c88b2d" />

<img width="1131" height="631" alt="WhatsApp Image 2026-06-13 at 11 33 15 PM" src="https://github.com/user-attachments/assets/c1387bdd-2c75-407a-bf9a-6d4390b56b5d" />

## Limitations

- Model predictions are probabilistic and should not be treated as definitive proof of audio authenticity.
- Detection performance may vary across recording conditions, audio quality, and unseen synthesis techniques.
- Further evaluation on diverse and independent datasets is needed to establish real-world reliability.

## Future Improvements

- Evaluate models on larger and more diverse datasets.
- Improve classification performance on unseen audio-generation techniques.
- Optimize inference speed and audio preprocessing.
- Extend analysis and visualization capabilities.
