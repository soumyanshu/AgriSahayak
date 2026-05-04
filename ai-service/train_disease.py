import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
import os
import json

def train_model():
    print("Initializing training for Pest & Disease Detection...")
    
    data_dir = 'PlantVillage/PlantVillage'
    
    if not os.path.exists(data_dir):
        print(f"Error: Directory {data_dir} not found.")
        return

    # Data augmentation and normalization
    data_transforms = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    print("Loading datasets...")
    image_dataset = datasets.ImageFolder(data_dir, data_transforms)
    
    # Extract class names
    class_names = image_dataset.classes
    print(f"Found {len(class_names)} classes.")
    
    # Save class names to json
    with open('disease_classes.json', 'w') as f:
        json.dump(class_names, f)
        
    dataloader = torch.utils.data.DataLoader(image_dataset, batch_size=32, shuffle=True, num_workers=0)
    
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Load MobileNetV2
    print("Loading MobileNetV2 base model...")
    model = models.mobilenet_v2(weights='DEFAULT')
    
    # Freeze layers
    for param in model.parameters():
        param.requires_grad = False
        
    # Replace classifier
    num_ftrs = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(num_ftrs, len(class_names))
    
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=0.001)

    # Train for just 1 epoch to save time for this prototype
    print("Training (Prototype Mode - Partial Epoch)...")
    model.train()
    running_loss = 0.0
    running_corrects = 0

    for i, (inputs, labels) in enumerate(dataloader):
        inputs = inputs.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()
        outputs = model(inputs)
        _, preds = torch.max(outputs, 1)
        loss = criterion(outputs, labels)
        
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * inputs.size(0)
        running_corrects += torch.sum(preds == labels.data)
        
        if i % 10 == 0:
            print(f"Batch {i} processed...")
            
        # Stop after 100 batches to get a somewhat decent prototype model
        if i >= 100:
            print("Stopping early for rapid prototype demonstration (after 100 batches).")
            break

    processed_samples = (i + 1) * 32
    epoch_loss = running_loss / processed_samples
    epoch_acc = running_corrects.double() / processed_samples

    print(f'Training Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')

    # Save the model
    print("Saving model weights to disease_model.pth...")
    torch.save(model.state_dict(), 'disease_model.pth')
    print("Training complete!")

if __name__ == '__main__':
    train_model()
