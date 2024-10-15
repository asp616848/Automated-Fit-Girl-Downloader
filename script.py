from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# Set up the Chrome driver path
driver_path = 'chromedriver.exe'  # Replace with your actual path
service = Service(driver_path)

# Initialize the browser driver
driver = webdriver.Chrome(service=service)

try:
    # Open the website with the list of links
    print("Opening the website...")
    driver.get('https://paste.fitgirl-repacks.site/?2d25d933656bc78a#6vZZAEdL8nYvhxN5Vji88SNLAkBEHhtXEUfQquPQ6Rw2')

    wait = WebDriverWait(driver, 15)  # Wait for elements to be clickable

    # Wait for page to load and grab all <a> links containing '.rar'
    print("Waiting for the page to load and links to appear...")
    
    # Wait for a specific container that might hold the links (change selector as necessary)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.links-container")))  # Change this to the actual container holding the links
    links = driver.find_elements(By.TAG_NAME, 'a')
    
    # Extract .rar links
    rar_links = [link for link in links if link.get_attribute('href') and '.rar' in link.get_attribute('href')]

    print(f"Found {len(rar_links)} .rar links.")

    # Process links in batches of 5
    batch_size = 5
    for i in range(0, len(rar_links), batch_size):
        batch = rar_links[i:i + batch_size]
        print(f"Processing batch: {i // batch_size + 1}...")

        for link in batch:
            try:
                print(f"Processing link: {link.get_attribute('href')}")

                # Open the link in the same tab
                driver.get(link.get_attribute('href'))
                time.sleep(3)  # Wait for the new page to load

                # Attempt to download twice
                print("Attempting to trigger download...")

                # Re-fetch the download button before each click
                download_button = wait.until(EC.presence_of_element_located((By.XPATH, '//*[contains(@onclick, "download")]')))

                for _ in range(2):  # Click twice
                    try:
                        driver.execute_script("arguments[0].click();", download_button)  # Click the button
                        print("Download button clicked.")
                        time.sleep(3)  # Wait for potential redirection
                    except Exception as click_error:
                        print(f"Error clicking download button: {click_error}")
                        # Try to re-fetch the button in case it becomes stale
                        download_button = wait.until(EC.presence_of_element_located((By.XPATH, '//*[contains(@onclick, "download")]')))

                time.sleep(5)  # Adjust the wait time based on how long the download initiation takes

            except Exception as e:
                print(f"Error processing link: {e}")

        if i + batch_size < len(rar_links):  # Avoid waiting after the last batch
            print("Waiting for 20 minutes before the next batch...")
            time.sleep(20 * 60)  # Wait for 20 minutes

finally:
    # Close the browser when done
    print("Script completed, closing browser...")
    driver.quit()
