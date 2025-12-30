import requests
from bs4 import BeautifulSoup
import re
import json

class AmazonScraper:
    def __init__(self):
        # Headers are crucial for Amazon to not block the request
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }

    def scrape(self, url: str) -> dict | None:
        try:
            print(f"Scraping URL: {url}")
            response = requests.get(url, headers=self.headers)
            if response.status_code != 200:
                print(f"Failed to fetch page: {response.status_code}")
                return None

            soup = BeautifulSoup(response.content, "lxml")
            
            # --- 1. Extract Title ---
            title_node = soup.find("span", attrs={"id": "productTitle"})
            title = title_node.text.strip() if title_node else "Unknown Product"

            # --- 2. Extract Price ---
            price_node = soup.find("span", class_="a-price-whole")
            price = price_node.text.strip() if price_node else "Price not found"

            # --- 3. Extract Features ---
            features = []
            about_list = soup.find('ul', class_="a-unordered-list a-vertical a-spacing-mini")
            if about_list:
                points = about_list.find_all('li')
                features = [p.text.strip() for p in points]

            # --- 4. Extract Images (ONLY STRATEGY 3) ---
            images = []
            
            # Find the specific UL with the class 'regularAltImageViewLayout'
            alt_ul = soup.find("ul", class_="regularAltImageViewLayout")
            
            if alt_ul:
                # Find all list items <li> within that list
                for item in alt_ul.find_all("li"):
                    # Deep search for the <img> tag inside the li structure
                    img = item.find("img")
                    if img:
                        src = img.get("src")
                        if src:
                            # REGEX: Find the size pattern (e.g. ._SS40_.) and replace it with ._SY300_.
                            # This handles variations like _SS40_, _SX50_, _AC_US40_, etc.
                            src_resized = re.sub(r'\._[A-Za-z]+\d+_\.', '._SY400_.', src)
                            
                            # Avoid duplicates
                            if src_resized not in images:
                                images.append(src_resized)
            else:
                print("Warning: 'regularAltImageViewLayout' list not found on this page.")

            # --- 5. Extract Reviews ---
            reviews = []
            review_elements = soup.find_all("span", attrs={"data-hook": "review-body"})
            if not review_elements:
                 review_elements = soup.find_all('span', class_='review-text-content')

            for r in review_elements[:10]:
                text = r.text.strip()
                if text:
                    reviews.append(text)
            
            # --- Output Results ---
            print(f"Found {len(images)} images via Strategy 3")

            data = {
                "name": title,
                "price": price,
                "features": features,
                "reviews": reviews,
                "images": images
            }
            return data

        except Exception as e:
            print(f"Scraping Error: {e}")
            return None

# --- Execution ---
if __name__ == "__main__":
    scraper = AmazonScraper()
    
    # Replace with your target product URL
    test_url = "https://www.amazon.com/dp/YOUR_PRODUCT_ID_HERE"
    
    # Run the scraper
    product_data = scraper.scrape(test_url)
    
    if product_data:
        print(json.dumps(product_data, indent=2))