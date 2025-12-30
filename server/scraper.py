import requests
from bs4 import BeautifulSoup
import re

class AmazonScraper:
    def __init__(self):
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
            
            # Extract Title
            title_node = soup.find("span", attrs={"id": "productTitle"})
            title = title_node.text.strip() if title_node else "Unknown Product"

            # Extract Price
            price_node = soup.find("span", class_="a-price-whole")
            price = price_node.text.strip() if price_node else "Price not found"

            # Extract Features
            features = []
            about_list = soup.find('ul', class_="a-unordered-list a-vertical a-spacing-mini")
            if about_list:
                points = about_list.find_all('li')
                features = [p.text.strip() for p in points]

            # Extract Reviews (First few)
            reviews = []
            review_list = soup.find_all('span', class_='review-text-content')
            for r in review_list[:5]: # Top 5 reviews
                text = r.text.strip()
                if text:
                    reviews.append(text)

            data = {
                "name": title,
                "price": price,
                "features": features,
                "reviews": reviews
            }
            return data

        except Exception as e:
            print(f"Scraping Error: {e}")
            return None
