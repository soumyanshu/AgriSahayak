import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import pickle
import os

print("Loading dataset...")
data_path = 'Crop_recommendation.csv'

if not os.path.exists(data_path):
    print(f"Error: {data_path} not found.")
    exit(1)

df = pd.read_csv(data_path)

# Separate features and labels
X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
y = df['label']

# Train test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training model...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Check accuracy
acc = model.score(X_test, y_test)
print(f"Model trained. Accuracy on test set: {acc:.2f}")

# Save the model
print("Saving model to model.pkl")
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)
print("Done!")
