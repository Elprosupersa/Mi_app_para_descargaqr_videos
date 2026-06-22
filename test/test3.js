const axios = require('axios');

async function test() {
  try {
    const url = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';
    console.log('Fetching oEmbed...');
    const response = await axios.get(`https://www.tiktok.com/oembed?url=${url}`);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
