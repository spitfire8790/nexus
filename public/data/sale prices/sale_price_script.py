import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import random
import re
import math
from urllib.parse import quote
from supabase import create_client
import os
from datetime import datetime


class PropertyScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Referer': 'https://www.getsoldprice.com.au/'
        }
        self.session = requests.Session()

    def format_suburb_name(self, suburb):
        """Format suburb name properly for URL"""
        # Convert "BONDI JUNCTION" to "Bondi Junction"
        words = suburb.strip().lower().split()
        formatted = ' '.join(word.capitalize() for word in words)
        # URL encode the space to %20
        return quote(formatted)

    def clean_land_size(self, land_size):
        """Clean land size string to extract just the number"""
        if land_size == "N/A":
            return land_size
        match = re.search(r'(\d+(?:\.\d+)?)', land_size)
        return match.group(1) if match else "N/A"

    def extract_property_details(self, panel, suburb):
        """Extract details from a single property panel"""
        try:
            # Check if this is a property panel by looking for house-image
            house_image = panel.find('div', class_='house-image')
            if not house_image:
                return None

            # Extract address
            title = panel.find('h4', class_='panel-title')
            address_link = title.find('a') if title else None
            if not address_link:
                return None
            address = address_link.text.strip()

            # Extract price and date
            body = panel.find('div', class_='panel-body')
            price = "N/A"
            sold_date = "N/A"

            if body:
                price_code = body.find('code')
                if price_code:
                    price = price_code.text.strip()

                date_text = body.find('p')
                if date_text and 'Sold' in date_text.text:
                    sold_date = date_text.text.split(' on ')[-1].strip()

            # Extract features
            features = panel.find('p', class_='features')
            property_type = "N/A"
            beds = baths = cars = "N/A"

            if features:
                # Property type
                type_span = features.find('span', class_='label-info')
                if type_span:
                    property_type = type_span.text.strip()

                # Bed, bath, car
                for span in features.find_all('span'):
                    if span.find('i', class_='bedrooms'):
                        beds = span.text.strip()
                    elif span.find('i', class_='bathrooms'):
                        baths = span.text.strip()
                    elif span.find('i', class_='car_spaces'):
                        cars = span.text.strip()

            # Extract land size
            house_desc = panel.find('div', class_='house-desc')
            land_size = "N/A"
            if house_desc:
                for div in house_desc.find_all('div'):
                    if div.text.startswith('Land Size:'):
                        land_size = div.text.replace('Land Size:', '').strip()

            # Clean land size to just the number
            land_size = self.clean_land_size(land_size)

            return {
                'suburb': suburb,
                'address': address,
                'price': price,
                'sold_date': sold_date,
                'property_type': property_type,
                'bedrooms': beds,
                'bathrooms': baths,
                'parking': cars,
                'land_size': land_size
            }

        except Exception as e:
            print(f"Error extracting property details: {str(e)}")
            return None

    def scrape_page(self, url, suburb):
        """Scrape a single page of property listings"""
        try:
            print(f"\nFetching URL: {url}")
            
            # Updated headers
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                # Remove Accept-Encoding to let requests handle it automatically
                'Connection': 'keep-alive',
                'Referer': 'https://www.getsoldprice.com.au/',
                'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Upgrade-Insecure-Requests': '1'
            }
            
            # Add a small delay before request
            time.sleep(random.uniform(2, 4))
            
            # Use a fresh session for each request
            session = requests.Session()
            
            # Make the request with verify=False to ignore SSL
            response = session.get(url, headers=headers, verify=False)
            response.raise_for_status()
            
            # Force encoding to utf-8
            response.encoding = 'utf-8'
            
            # Print the first 1000 characters of response for debugging
            print("\nResponse preview:")
            print(response.text[:1000])
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Try to find any content to verify we're getting HTML
            print("\nPage title:", soup.title.string if soup.title else "No title found")
            
            # Find all property panels - try different selectors
            panels = []
            panels.extend(soup.find_all('div', class_='panel-primary'))
            panels.extend(soup.find_all('div', class_='property-panel'))
            panels.extend(soup.find_all('div', {'data-type': 'property'}))
            panels.extend(soup.find_all('div', class_='property-listing'))  # Add another common class
            
            print(f"Found {len(panels)} property panels on this page")
            
            if len(panels) == 0:
                # Try to find any divs to debug
                all_divs = soup.find_all('div')
                print(f"\nFound {len(all_divs)} total divs on page")
                print("First few div classes:", [div.get('class', ['no-class']) for div in all_divs[:5]])
            
            properties = []
            for panel in panels:
                property_details = self.extract_property_details(panel, suburb)
                if property_details:
                    properties.append(property_details)
                    print(f"Successfully extracted property: {property_details['address']}")
            
            return soup, properties
            
        except Exception as e:
            print(f"Error scraping page {url}: {str(e)}")
            return None, []

    def scrape_suburb(self, state, postcode, suburb, year_min=2024, year_max=2024):
        """Scrape all pages for a given suburb with year filter"""
        all_properties = []
        page = 1
        total_pages = None  # Initialize total_pages
        
        # Format suburb name properly
        formatted_suburb = self.format_suburb_name(suburb)
        print(f"\nFormatted suburb name: {formatted_suburb}")
        
        # First page URL
        url = f"https://www.getsoldprice.com.au/sold/list/state/{state}/postcode/{postcode}/suburb/{formatted_suburb}/?type=all&ymin={year_min}&ymax={year_max}&bmin=0&bmax=0&pmin=0&pmax=0&sort=date&kw="
        
        # Get first page and total results
        soup, properties = self.scrape_page(url, suburb)
        
        if soup:
            total_results = self.get_total_results(soup)
            if total_results:
                # Each page shows 12 results
                total_pages = math.ceil(total_results / 12)
                print(f"\nFound {total_results} total properties across {total_pages} pages")
        
        if properties:
            all_properties.extend(properties)
        
        # Continue with remaining pages
        while True:
            if total_pages and page >= total_pages:
                print("\nReached last page")
                break
            
            page += 1
            next_url = f"https://www.getsoldprice.com.au/sold/list/p/{page}/state/{state}/postcode/{postcode}/suburb/{formatted_suburb}/sort/date/type/all/ymin/{year_min}/ymax/{year_max}/"
            
            print(f"\nScraping page {page} of {total_pages or 'unknown'}...")
            _, properties = self.scrape_page(next_url, suburb)
            
            if not properties:
                print(f"No properties found on page {page}, stopping.")
                break
            
            all_properties.extend(properties)
            print(f"Total properties scraped so far: {len(all_properties)}")
            
            time.sleep(random.uniform(2, 4))
        
        return pd.DataFrame(all_properties) if all_properties else pd.DataFrame()

    def get_total_results(self, soup):
        """Extract total number of results from the page"""
        try:
            breadcrumb = soup.find('li', class_='active')
            if breadcrumb and 'Displaying' in breadcrumb.text:
                total_text = breadcrumb.text
                match = re.search(r'of (\d+)', total_text)
                if match:
                    return int(match.group(1))
        except Exception as e:
            print(f"Error getting total results: {e}")
        return None

def main():
    # Supabase configuration - replace these with your actual values
    supabase_url = "https://bgrbegqeoyolkrxjebho.supabase.co"  # Replace with your URL
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncmJlZ3Flb3lvbGtyeGplYmhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTgwOTE2MiwiZXhwIjoyMDQ3Mzg1MTYyfQ.RUO1z5vTRzytsJYdeBQNJNdt7fTh1shLygxtSpuCM1I"  # Replace with your service role key

    # Comment out the environment variable check
    # if not supabase_url or not supabase_key:
    #     raise ValueError("Please set SUPABASE_URL and SUPABASE_KEY environment variables")

    supabase = create_client(supabase_url, supabase_key)

    # Use full path to suburbs.csv
    csv_path = r"C:\Users\James\Desktop\nexus\public\data\sale prices\suburbs.csv"
    suburbs_to_scrape = pd.read_csv(csv_path)

    scraper = PropertyScraper()

    # Add progress tracking
    total_suburbs = len(suburbs_to_scrape)
    for index, suburb_info in suburbs_to_scrape.iterrows():
        print(f"\nProcessing suburb {index + 1} of {total_suburbs}: {suburb_info['suburb']}")
        df = scraper.scrape_suburb(
            state='NSW',
            postcode=str(suburb_info['postcode']),
            suburb=suburb_info['suburb'],
            year_min=2024,
            year_max=2024
        )
        
        if not df.empty:
            # Clean the current suburb's data
            df = df.replace('N/A', pd.NA)
            df = df.dropna(how='all')
            
            if 'price' in df.columns:
                df['price'] = df['price'].str.replace('$', '').str.replace(',', '')
                df['price'] = pd.to_numeric(df['price'], errors='coerce')
            
            if 'sold_date' in df.columns:
                # Convert Timestamp to ISO format string
                df['sold_date'] = pd.to_datetime(df['sold_date'], errors='coerce').dt.strftime('%Y-%m-%d')
            
            for col in ['bedrooms', 'bathrooms', 'parking', 'land_size']:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            
            df['collected_at'] = datetime.now().isoformat()
            
            # Convert to records and upload in batches
            records = df.to_dict('records')
            batch_size = 100
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                try:
                    print(f"\nAttempting to upload batch with data sample:")
                    print(f"First record in batch: {batch[0]}")
                    
                    # Convert NaN/None values to None for JSON serialization
                    clean_batch = []
                    for record in batch:
                        clean_record = {}
                        for key, value in record.items():
                            if pd.isna(value):
                                clean_record[key] = None
                            else:
                                clean_record[key] = value
                        clean_batch.append(clean_record)
                    
                    response = supabase.table('nsw_property_sales').upsert(
                        clean_batch,
                        on_conflict='address,sold_date'
                    ).execute()
                    
                    print(f"Successfully uploaded batch {i // batch_size + 1}")
                    
                except Exception as e:
                    print(f"Error uploading batch for {suburb_info['suburb']}")
                    print(f"Error details: {str(e)}")
                    print(f"Error type: {type(e)}")
                    if hasattr(e, 'response'):
                        print(f"Response status: {e.response.status_code}")
                        print(f"Response text: {e.response.text}")
            
            print(f"Successfully processed {len(df)} properties from {suburb_info['suburb']}")
        else:
            print(f"No properties found in {suburb_info['suburb']}")
        
        time.sleep(random.uniform(3, 5))

    # ... rest of the code for final summary ...

if __name__ == "__main__":
    main()