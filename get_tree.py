import os

def generate_tree(dir_path, prefix="", ignore_dirs=None):
    if ignore_dirs is None:
        ignore_dirs = {'.git', 'node_modules', 'venv', 'venv311', '__pycache__', 'PlantVillage'}
    
    # Get items in directory, sorted
    try:
        items = sorted(os.listdir(dir_path))
    except PermissionError:
        return ""
        
    tree_str = ""
    for i, item in enumerate(items):
        if item in ignore_dirs:
            continue
            
        path = os.path.join(dir_path, item)
        is_last = (i == len(items) - 1)
        
        # Adjust formatting for last item
        connector = "└── " if is_last else "├── "
        tree_str += f"{prefix}{connector}{item}\n"
        
        if os.path.isdir(path):
            extension = "    " if is_last else "│   "
            tree_str += generate_tree(path, prefix=prefix + extension, ignore_dirs=ignore_dirs)
            
    return tree_str

if __name__ == "__main__":
    print("Agrisahayak/")
    print(generate_tree("."))
