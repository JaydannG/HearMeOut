const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/submit-form', (req, res) => {
    const artist = req.body.artist;
    console.log("Artist: ", artist);
    res.json({ message: `Received artist: ${artist}`});
});

app.listen(port, () => {
    console.log(`Server listening at http://loaclhost:${port}`);
});