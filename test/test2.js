const axios = require('axios');

async function test() {
  try {
    const url = 'https://www.tiktok.com/@tiktok/video/7106594312292453678';
    console.log('Fetching from tikwm...');
    const response = await axios.post('https://www.tikwm.com/api/', { url, hd: 1 });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
