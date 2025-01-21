import os
import shutil
import re
import subprocess

def ensure_dir(directory):
    """Create directory if it doesn't exist"""
    if not os.path.exists(directory):
        os.makedirs(directory)

def copy_files(src_dir, dest_dir):
    """Copy all files from source to destination directory"""
    if not os.path.exists(src_dir):
        print(f"Source directory {src_dir} does not exist")
        return False
    if os.path.exists(dest_dir):
        shutil.rmtree(dest_dir)
    shutil.copytree(src_dir, dest_dir)
    return True

def update_imports(file_path):
    """Update import paths in the file"""
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Update the import paths
    updated_content = re.sub(
        r'from \'../../../../../../public/scripts/',
        'from \'../../../../../',
        content
    )
    updated_content = re.sub(
        r'import \{[^}]+\} from \'../../../../../../public/scripts/',
        lambda m: m.group().replace('../../../../../../public/scripts/', '../../../../../'),
        content
    )

    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)

def process_js_files(directory):
    """Process all JS files in the directory"""
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.js'):
                file_path = os.path.join(root, file)
                update_imports(file_path)

def compile_sass():
    """Compile SASS to CSS"""
    src_scss = 'src/styles/main.scss'
    dist_css = 'dist/styles/style.css'

    if not os.path.exists(src_scss):
        print(f"SASS file {src_scss} does not exist")
        return False

    # Ensure dist/styles directory exists
    ensure_dir('dist/styles')

    try:
        # Run sass command using npm
        subprocess.run(['npm', 'exec', '--', 'sass', src_scss, dist_css], shell=True, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error compiling SASS: {e}")
        return False

def main():
    src_dir = 'src/scripts'
    dist_dir = 'dist/scripts'

    # Ensure dist directory exists
    ensure_dir('dist')

    # Copy and process JS files
    if copy_files(src_dir, dist_dir):
        process_js_files(dist_dir)
        print("Successfully processed JS files")
    else:
        print("Failed to process JS files")

    # Compile SASS
    if compile_sass():
        print("Successfully compiled SASS")
    else:
        print("Failed to compile SASS")

if __name__ == '__main__':
    main()
