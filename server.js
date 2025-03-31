const express = require('express');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

const app = express();
const PORT = 3000;

// Serve static files from "public" directory
app.use(express.static('public'));

// Function to load CSV data into an array
const loadCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        let data = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => data.push(row))
            .on('end', () => resolve(data))
            .on('error', (error) => reject(error));
    });
};

// Route to get all articles
app.get('/articles', async (req, res) => {
    try {
        const articles = await loadCSV(path.join(__dirname, 'data', 'articles.csv'));
        articles.forEach(article => {
            if (article.image) article.image = `/images/${article.image}`;
            if (article.video) article.video = `/videos/${article.video}`;
        });
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: 'Error loading articles' });
    }
});

// Route to get a specific article by ID using wc_id parameter
app.get('/articles/', async (req, res) => {
    try {
        const wc_id = req.query.wc_id;
        if (!wc_id) {
            return res.status(400).json({ error: 'No article ID provided' });
        }
        
        const articles = await loadCSV(path.join(__dirname, 'data', 'articles.csv'));
        const article = articles.find(a => a.id === wc_id);

        if (article) {
            if (article.image) article.image = `/images/${article.image}`;
            if (article.video) article.video = `/videos/${article.video}`;
            res.json(article);
        } else {
            res.status(404).json({ error: 'Article Not Found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving article' });
    }
});

// Route to handle search functionality for articles
app.get('/search', async (req, res) => {
    try {
        const query = req.query.wc_query ? req.query.wc_query.toLowerCase().trim() : '';
        if (!query) {
            return res.redirect('/search.html?error=No search query provided');
        }

        const articles = await loadCSV(path.join(__dirname, 'data', 'articles.csv'));

        const articleResults = articles.filter(article =>
            article.title.toLowerCase().includes(query) ||
            article.description.toLowerCase().includes(query) ||
            (article.content && article.content.toLowerCase().includes(query))
        );

        articleResults.forEach(article => {
            if (article.image) article.image = `/images/${article.image}`;
            if (article.video) article.video = `/videos/${article.video}`;
        });

        res.json(articleResults);
    } catch (error) {
        res.status(500).json({ error: 'Error processing search' });
    }
});

// Ensure static file serving for images and videos
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
