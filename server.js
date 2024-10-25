const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use('/modules', express.static('node_modules'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
