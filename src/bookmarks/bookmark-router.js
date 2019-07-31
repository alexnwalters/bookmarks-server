const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const bookmarks = require('../store')
const bookmarksServices = require('../bookmarksService')

const bookmarkRouter = express.Router()
const bodyParser = express.json()

bookmarkRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')

        bookmarksServices.getAllBookmarks(knexInstance)
        .then(bookmarks => {
            res.json(bookmarks)
        })
        .catch(next)
    })
    .post(bodyParser, (req, res) => {
        const {title, url, description, rating} = req.body;

        if(!title) {
            logger.error('Title is required');
            return res
                .status(400)
                .send('Invalid Data')
        };

        if(!url) {
            logger.error('URL is required');
            return res
                .status(400)
                .send('Invalid Data')
        };

        if(!description) {
            logger.error('Description');
            return res
                .status(400)
                .send('Invalid Data')
        };

        const id = uuid();

        const bookmark = {
            id,
            title,
            url,
            description,
            rating
        };

        bookmarks.push(bookmark);

        logger.info(`Bookmark with id ${id} created`);

        res
            .status(201)
            .location(`https://localhoast:8000/bookmarks/${id}`)
            .json(bookmark)
    })

bookmarkRouter
    .route('/bookmarks/:id')
    .get((req, res) => {
        const { id } = req.params;
        const bookmark = bookmarks.find(b => b.id == id);

        if(!bookmark) {
            logger.error(`Bookmark with id ${id} not found.`)
            return res
                .status(404)
                .send('Not Found')
        }

        res.json(bookmark)
    })
    .delete((req, res) => {
        const { id } = req.params;

        const bookmarkIndex = bookmarks.findIndex(b => b.id == id);

        if(bookmarkIndex === -1) {
            logger.error(`Bookmark with id ${id} not found.`)
        }

        bookmarks.splice(bookmarkIndex, 1)

        logger.info('Delete Bookmark with id ${id}.')

        res
            .status(204)
            .end()

    })

module.exports = bookmarkRouter