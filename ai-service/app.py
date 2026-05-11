from flask import Flask, request, jsonify
from flask_cors import CORS

import pickle
import pandas as pd
import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import img_to_array
import numpy as np
from PIL import Image
import io
import json
from groq import Groq

app = Flask(__name__)
CORS(app)

model_path = 'model.pkl'

# Load the model globally
if os.path.exists(model_path):
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    print("Model loaded successfully.")
else:
    model = None
    print("Warning: model.pkl not found. Please run train.py first.")

# --- Disease Detection Setup ---
disease_model_path = 'agri_smart_full_model.h5'
classes_path = 'disease_classes.json'

groq_client = Groq(api_key="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")

disease_model = None
disease_classes = []

def get_disease_model():
    global disease_model, disease_classes
    if disease_model is not None:
        return disease_model
        
    if os.path.exists(disease_model_path) and os.path.exists(classes_path):
        with open(classes_path, 'r') as f:
            disease_classes = json.load(f)
            
        try:
            disease_model = tf.keras.models.load_model(disease_model_path, compile=False)
            print("Disease model loaded lazily. Warming up...")
            dummy_input = np.zeros((1, 224, 224, 3), dtype=np.float32)
            disease_model.predict(dummy_input, verbose=0)
            print("Disease model warmed up successfully.")
        except Exception as e:
            print(f"Error loading disease model: {e}")
            disease_model = None
    else:
        print("Warning: agri_smart_full_model.h5 or disease_classes.json not found.")
        
    return disease_model

def process_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    image = image.resize((224, 224))
    img_array = img_to_array(image)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0
    return img_array

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model not trained yet."}), 500
        
    try:
        data = request.json
        
        # Extract features required by the model
        N = float(data.get('N', 0))
        P = float(data.get('P', 0))
        K = float(data.get('K', 0))
        temperature = float(data.get('temperature', 0))
        humidity = float(data.get('humidity', 0))
        ph = float(data.get('ph', 0))
        rainfall = float(data.get('rainfall', 0))
        
        # Create a dataframe for prediction
        input_data = pd.DataFrame([[N, P, K, temperature, humidity, ph, rainfall]], 
                                  columns=['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'])
        
        prediction = model.predict(input_data)[0]
        
        # Capitalize the predicted crop name
        prediction = str(prediction).capitalize()
        
        return jsonify({
            "success": True,
            "recommendation": prediction
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/predict_disease', methods=['POST'])
def predict_disease():
    model_instance = get_disease_model()
    if model_instance is None:
        return jsonify({"error": "Disease model not trained yet."}), 500
        
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image file provided."}), 400
        
    try:
        file = request.files['image']
        image_bytes = file.read()
        tensor = process_image(image_bytes)
        
        outputs = model_instance.predict(tensor)
        probabilities = outputs[0]
        predicted_idx = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_idx])
            
        class_name = disease_classes[predicted_idx]
        conf_percentage = round(confidence * 100, 2)
        
        clean_name = class_name.replace('___', ' ').replace('__', ' ').replace('_', ' ')
        if clean_name.lower() == "plantvillage":
            clean_name = "Unrecognized (Please take a clearer photo)"
        
        # Dynamic Recommendation via Groq API
        rec = "Keep monitoring your crops."
        if clean_name == "Unrecognized (Please take a clearer photo)":
            rec = "Please upload a clearer image of a plant leaf so the AI can analyze it properly."
        else:
            try:
                chat_completion = groq_client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert agricultural AI assistant. A farmer has uploaded a photo of a crop leaf and the AI detected the following disease. Provide a brief, actionable, and highly specific 2-sentence recommendation on how to treat or manage it. Speak directly to the farmer. Do not use markdown."
                        },
                        {
                            "role": "user",
                            "content": f"The detected plant disease is: {clean_name}"
                        }
                    ],
                    model="llama3-8b-8192",
                    temperature=0.5,
                    max_tokens=100,
                    timeout=5,
                )
                rec = chat_completion.choices[0].message.content.strip()
            except Exception as e:
                print("Groq API Error:", e)
                # Fallback simple logic
                if "blight" in clean_name.lower():
                    rec = "Apply fungicide (like Mancozeb) immediately to prevent spreading."
                elif "spot" in clean_name.lower():
                    rec = "Remove affected leaves and use copper-based bactericide."
                elif "virus" in clean_name.lower() or "mosaic" in clean_name.lower():
                    rec = "No cure for viral infections. Remove and destroy infected plants."
                elif "healthy" in clean_name.lower():
                    rec = "Crop looks healthy! Maintain good agricultural practices."
            
        return jsonify({
            "success": True,
            "disease": clean_name,
            "confidence": conf_percentage,
            "recommendation": rec
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == '__main__':
    app.run(port=5001, debug=True)
