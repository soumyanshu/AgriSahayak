from flask import Flask, request, jsonify
from flask_cors import CORS

import pickle
import pandas as pd
import os
import torch
import torch.nn as nn
from torchvision import models, transforms
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
disease_model_path = 'disease_model.pth'
classes_path = 'disease_classes.json'

groq_client = Groq(api_key="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")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

if os.path.exists(disease_model_path) and os.path.exists(classes_path):
    with open(classes_path, 'r') as f:
        disease_classes = json.load(f)
        
    disease_model = models.mobilenet_v2(weights=None)
    num_ftrs = disease_model.classifier[1].in_features
    disease_model.classifier[1] = nn.Linear(num_ftrs, len(disease_classes))
    
    disease_model.load_state_dict(torch.load(disease_model_path, map_location=device, weights_only=True))
    disease_model = disease_model.to(device)
    disease_model.eval()
    print("Disease model loaded successfully.")
else:
    disease_model = None
    disease_classes = []
    print("Warning: disease_model.pth not found. Please run train_disease.py.")

def process_image(image_bytes):
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    return transform(image).unsqueeze(0)

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
    if disease_model is None:
        return jsonify({"error": "Disease model not trained yet."}), 500
        
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image file provided."}), 400
        
    try:
        file = request.files['image']
        image_bytes = file.read()
        tensor = process_image(image_bytes).to(device)
        
        with torch.no_grad():
            outputs = disease_model(tensor)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
            confidence, predicted_idx = torch.max(probabilities, 0)
            
        class_name = disease_classes[predicted_idx.item()]
        conf_percentage = round(confidence.item() * 100, 2)
        
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
