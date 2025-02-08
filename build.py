import os
import shutil
import subprocess
import sys

def ensure_dir(directory):
    """Create directory if it doesn't exist"""
    if not os.path.exists(directory):
        os.makedirs(directory)

def compile_js_files():
    """Compiles js"""
    try:
        # Run compile command using npm
        subprocess.run(['npm', 'run', 'compile'], shell=True, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error on compile {e}")
        return False

def compile_sass():
    """Compile SASS to CSS"""
    src_scss = 'src/styles/main.scss'
    dist_css = 'dist/style.css'

    if not os.path.exists(src_scss):
        print(f"SASS file {src_scss} does not exist")
        return False

    try:
        # Run sass command using npm
        source_map_option = '--no-source-map' if os.environ.get('BUILD_TYPE') == 'production' else '--source-map'
        subprocess.run(['npm', 'exec', '--', 'sass', src_scss, dist_css, source_map_option], shell=True, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error compiling SASS: {e}")
        return False

def main():
    # Get build type from arguments, default to 'dev'
    build_type = 'dev'
    if len(sys.argv) > 1:
        build_type = sys.argv[1].lower()

    if build_type not in ['dev', 'production']:
        print("Invalid build type. Using 'dev'")
        build_type = 'dev'

    # Set environment variable for Rollup
    os.environ['BUILD_TYPE'] = build_type
    print(f"Building for {build_type}")

    # # Delete dist directory if it exists
    # if os.path.exists('dist'):
    #     shutil.rmtree('dist')
    #     print("Deleted dist directory")

    # # Ensure dist directory exists
    # ensure_dir('dist')

    # if not compile_js_files():
    #     print("JS compilation gone wrong")

    # Compile SASS
    if compile_sass():
        print("Successfully compiled SASS")
    else:
        print("Failed to compile SASS")

if __name__ == '__main__':
    main()
