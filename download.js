const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const readline = require('readline');

// Create an interface to listen for key presses
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to wait for a specified time or until a key is pressed
async function waitForOrSkip(timeout) {
    return new Promise(resolve => {
        const timer = setTimeout(() => {
            resolve(); // Resolve after timeout
        }, timeout);

        // Listen for key press
        rl.on('line', () => {
            clearTimeout(timer); // Clear the timer if a key is pressed
            resolve(); // Resolve immediately
        });
    });
}

// Function to download files
async function downloadFiles(links, downloadPath) {
    const browser = await puppeteer.launch({ headless: false });
    const pages = []; // Array to keep track of opened pages

    // Prompt user to change download settings
    console.log(`Please change your downloads directory in the settings of the browser to: ${downloadPath}`);
    await new Promise(resolve => setTimeout(resolve, 30000)); // Delay for 30 seconds

    for (const link of links) {
        const page = await browser.newPage();
        pages.push(page); // Add the new page to the array

        // Listen for new tabs or windows
        const newPagePromise = new Promise(resolve => browser.once('targetcreated', target => resolve(target.page())));

        // Enable request interception
        await page.setRequestInterception(true);

        // Intercept requests to prevent loading ad pages
        page.on('request', (request) => {
            const url = request.url();

            // Block requests to ad pages
            if (url.includes('ad') || url.includes('redirect') || url.includes('tracking')) {
                request.abort(); // Prevent the request from loading
            } else {
                request.continue(); // Allow other requests
            }
        });

        try {
            console.log(`Navigating to: ${link}`);
            await page.goto(link, { waitUntil: 'networkidle2' });

            // Call the download function for the first time
            console.log('Calling download for the first time...');
            await page.evaluate(() => {
                if (typeof download === 'function') {
                    download();
                }
            });

            // Wait for the new tab or redirected page
            const newPage = await newPagePromise;
            if (newPage) {
                console.log('New page opened, handling the download there...');
                await newPage.waitForSelector('body'); // Make sure the new page has loaded
                newPage.close()
            }

            // Call the download function for the second time
            console.log('Calling download for the second time...');
            await page.evaluate(() => {
                if (typeof download === 'function') {
                    download();
                }
            });

            // Wait before closing the last two tabs
            console.log('Waiting for 5 seconds before closing tabs...');
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds

            // Wait for 90 seconds before the next download, or skip if a key is pressed
            console.log('Waiting for 90 seconds before the next download... (Press Enter to skip)');
            await waitForOrSkip(1000 * 90); // Wait for 90 seconds or skip
            await page.close()
        } catch (error) {
            console.error(`Error processing ${link}:`, error);
            await page.close(); // Close the page even if there was an error
        }
    }

    await browser.close();
    rl.close(); // Close the readline interface
}

// Read links from the text file
fs.readFile('rar_links.txt', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }
    const links = data.split('\n').filter(link => link.trim() !== '');

    // Define the download path
    const downloadPath = path.resolve(__dirname, 'downloads');
    console.log(`Download path set to: ${downloadPath}`);

    // Estimate total download time (90 seconds per download for 2 downloads)
    const estimatedTime = links.length * 2 * (90 + 10) / 60; // 90s wait + 10s download for 2 calls
    console.log(`Estimated total download time: ${estimatedTime.toFixed(2)} minutes`);

    downloadFiles(links, downloadPath);
});
