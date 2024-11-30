const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config(); 

const app = express();
app.use(cors()); 

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

app.get('/lastfm/heatmap', async (req, res) => {
  try {
    const { username, year, month } = req.query;  

    if (!username || !year || !month) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const startOfMonth = new Date(year, month - 1, 1); 
    const endOfMonth = new Date(year, month, 0); 

    const dayData = [];

    for (let day = 1; day <= endOfMonth.getDate(); day++) {
      const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const startTimestamp = new Date(`${date}T00:00:00Z`).getTime() / 1000; 
      const endTimestamp = new Date(`${date}T23:59:59Z`).getTime() / 1000;

      const url = `https://ws.audioscrobbler.com/2.0/?method=user.getRecentTracks&user=${username}&from=${startTimestamp}&to=${endTimestamp}&api_key=${LASTFM_API_KEY}&format=json`;
      
      const response = await fetch(url);
      const data = await response.json();

      const tracks = data.recenttracks.track;
      const trackCount = {};

   
      tracks.forEach((track) => {
        const trackName = track.name;
        trackCount[trackName] = (trackCount[trackName] || 0) + 1;
      });

 
      const mostPlayed = Object.entries(trackCount).sort((a, b) => b[1] - a[1])[0];

      dayData.push({
        date: date,
        mostPlayedTrack: mostPlayed ? mostPlayed[0] : 'No data',
        playCount: mostPlayed ? mostPlayed[1] : 0,
      });
    }


    res.json(dayData);
  } catch (error) {
    console.error('Error fetching data from Last.fm:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from Last.fm' });
  }
});


const PORT = process.env.PORT || 5000;  
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
