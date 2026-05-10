import h5py

try:
    with h5py.File('agri_smart_full_model.h5', 'r') as f:
        print("Successfully opened the model file.")
        print(f"File Keys: {list(f.keys())}")
        if 'model_weights' in f:
            print("Model weights found!")
        if 'model_config' in f:
            print("Model config found!")
            config = f.attrs.get('model_config')
            if config:
                print("Model config is present.")
            else:
                print("No detailed config found in attrs.")
except Exception as e:
    print(f"Error reading model: {e}")
