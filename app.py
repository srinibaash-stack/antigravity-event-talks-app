import os
import json
import ssl
import urllib.request
import feedparser
from datetime import datetime
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_FILE = "cache.json"

def fetch_and_parse_feed():
    try:
        # Create an unverified SSL context to prevent SSL verification failures in local dev
        context = ssl._create_unverified_context()
        
        # Configure headers to look like a standard browser request
        req = urllib.request.Request(
            FEED_URL,
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        
        with urllib.request.urlopen(req, context=context, timeout=15) as response:
            xml_data = response.read()
            
        feed = feedparser.parse(xml_data)
        
        if not feed.entries:
            raise Exception("No entries found in feed or parsing failed.")
            
        parsed_notes = []
        
        for entry_index, entry in enumerate(feed.entries):
            date_str = entry.title if hasattr(entry, 'title') else 'Unknown Date'
            entry_id = entry.id if hasattr(entry, 'id') else f"id-{entry_index}"
            link = entry.link if hasattr(entry, 'link') else "https://cloud.google.com/bigquery/docs/release-notes"
            updated = entry.updated if hasattr(entry, 'updated') else datetime.now().isoformat()
            
            content_html = ""
            if hasattr(entry, 'content') and entry.content:
                content_html = entry.content[0].value
            elif hasattr(entry, 'summary'):
                content_html = entry.summary
                
            if not content_html:
                continue
                
            soup = BeautifulSoup(content_html, 'html.parser')
            h3_tags = soup.find_all('h3')
            
            if not h3_tags:
                # If there are no h3 headers, treat the entire content as one update
                desc_text = soup.get_text().strip()
                parsed_notes.append({
                    'id': f"{entry_id}_0",
                    'date': date_str,
                    'updated': updated,
                    'link': link,
                    'category': 'Update',
                    'description_html': content_html,
                    'description_text': desc_text
                })
            else:
                for h3_index, h3 in enumerate(h3_tags):
                    category = h3.get_text().strip()
                    
                    # Gather all siblings until the next h3 tag
                    desc_elements = []
                    sibling = h3.next_sibling
                    while sibling and sibling.name != 'h3':
                        desc_elements.append(sibling)
                        sibling = sibling.next_sibling
                        
                    # Rebuild HTML content for this update
                    desc_html = "".join(str(el) for el in desc_elements).strip()
                    
                    # Parse text for sharing/tweeting
                    desc_soup = BeautifulSoup(desc_html, 'html.parser')
                    desc_text = desc_soup.get_text().strip()
                    
                    # Normalize category for uniform badge classes (Feature, Issue, etc.)
                    normalized_cat = category.capitalize()
                    
                    parsed_notes.append({
                        'id': f"{entry_id}_{h3_index}",
                        'date': date_str,
                        'updated': updated,
                        'link': link,
                        'category': normalized_cat,
                        'description_html': desc_html,
                        'description_text': desc_text
                    })
                    
        # Sort notes by updated timestamp (latest first)
        # Using updated or parse it to datetime if possible, but the feed is usually sorted.
        # Let's ensure a robust sort.
        try:
            parsed_notes.sort(key=lambda x: x.get('updated', ''), reverse=True)
        except Exception:
            pass # Keep original order if sorting fails
            
        cache_data = {
            'last_updated': datetime.now().isoformat(),
            'notes': parsed_notes
        }
        
        with open(CACHE_FILE, 'w') as f:
            json.dump(cache_data, f, indent=2)
            
        return cache_data, None
        
    except Exception as e:
        print(f"Error updating feed: {e}")
        return None, str(e)

def get_cached_notes():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                data = json.load(f)
                return data
        except Exception as e:
            print(f"Error reading cache: {e}")
            
    # If no cache exists, fetch
    data, err = fetch_and_parse_feed()
    if data:
        return data
    return {
        'last_updated': None,
        'notes': []
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes', methods=['GET'])
def api_notes():
    cache = get_cached_notes()
    return jsonify(cache)

@app.route('/api/refresh', methods=['GET', 'POST'])
def api_refresh():
    cache_data, err = fetch_and_parse_feed()
    if err:
        # If there's an error, try to return cached data but flag the error
        existing_cache = get_cached_notes()
        return jsonify({
            'status': 'error',
            'message': f"Failed to refresh feed: {err}. Showing cached data.",
            'last_updated': existing_cache.get('last_updated'),
            'notes': existing_cache.get('notes', [])
        }), 502
    
    return jsonify({
        'status': 'success',
        'message': 'Feed refreshed successfully',
        'last_updated': cache_data['last_updated'],
        'notes': cache_data['notes']
    })

if __name__ == '__main__':
    # Initialize cache on start
    get_cached_notes()
    app.run(debug=True, port=5001)
