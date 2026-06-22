const { Downloader } = require('@tobyg74/tiktok-api-dl');

async function test() {
  try {
    const url = 'https://www.tiktok.com/@tiktok/video/7106594312292453678';
    console.log('Fetching:', url);
    const result = await Downloader(url, { version: "v1" });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
