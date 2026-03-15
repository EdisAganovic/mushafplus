import os
import urllib.request
from concurrent.futures import ThreadPoolExecutor

def download_page(page_num):
    padded = str(page_num).zfill(3)
    url = f"https://raw.githubusercontent.com/batoulapps/quran-svg/main/svg/{padded}.svg"
    target = f"assets/pages/{padded}.svg"
    
    if os.path.exists(target):
        return f"Skipped {padded}"
        
    try:
        urllib.request.urlretrieve(url, target)
        return f"Downloaded {padded}"
    except Exception as e:
        return f"Failed {padded}: {e}"

def main():
    if not os.path.exists("assets/pages"):
        os.makedirs("assets/pages")
        
    print("Starting download of 604 pages... This may take a minute.")
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(download_page, range(1, 605)))
        
    failed = [r for r in results if "Failed" in r]
    print(f"Finished. Success: {604 - len(failed)}, Failed: {len(failed)}")
    if failed:
        for f in failed:
            print(f)

if __name__ == "__main__":
    main()
