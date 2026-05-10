import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import tensorflow as tf
import numpy as np

print("Loading model...")
model = tf.keras.models.load_model('agri_smart_full_model.h5')
print("Model loaded.")
print(model.summary())

# Check input and output shapes
input_shape = model.input_shape
output_shape = model.output_shape

print(f"Input Shape: {input_shape}")
print(f"Output Shape: {output_shape}")

# Test predict
dummy_input = np.zeros((1,) + input_shape[1:])
pred = model.predict(dummy_input)
print(f"Prediction shape: {pred.shape}")
