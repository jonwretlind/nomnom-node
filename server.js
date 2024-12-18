const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use('/modules', express.static('node_modules'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server listening on port ${process.env.PORT || 3000}`);
  });