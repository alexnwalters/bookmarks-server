const express = require('express')
//const uuid = require('uuid/v4')
const logger = require('../logger')
//const bookmarks = require('../store')
const path = require('path')
const bookmarksServices = require('../bookmarksService')
const xss = require('xss')

const bookmarkRouter = express.Router()
const bodyParser = express.json()

const sanitizeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: bookmark.url,
    description: xss(bookmark.description),
    rating: Number(bookmark.rating),
})

bookmarkRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')

        bookmarksServices.getAllBookmarks(knexInstance)
        .then(bookmarks => {
            res.json(bookmarks.map(sanitizeBookmark))
        })
        .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        for (const field of ['title', 'url', 'rating']) {
            if (!req.body[field]) {
                logger.error(`${field} is required`)
                return res
                    .status(400)
                    .json({
                        error: { message: `Missing '${field}' in request body` }
                    })
            }
        }

        const {title, url, description, rating} = req.body

        if (/*!Number.isInteger(rating) ||*/ rating < 0 || rating > 5) {
            logger.error(`Invalid rating '${rating}' supplied`)
            return res.status(400).send({
              error: { message: `'rating' must be a number between 0 and 5` }
            })
        }

        const newBookmark = { title, url, description, rating }

        //const id = uuid() why do we no longer need this?

        bookmarksServices.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                logger.info(`Bookmark with id ${bookmark.id} created`);
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
                    .json(sanitizeBookmark(bookmark))
            })
            .catch(next)
    })

bookmarkRouter
    .route('/:id')
    .all((req, res, next) => {
        bookmarksServices.getById(
            req.app.get('db'),
            req.params.id
        )
        .then(bookmark => {
            if (!bookmark) {
                return res.status(404).json({
                    error: { message: `Bookmark doesn't exist` }
                })
            }
            res.bookmark = bookmark
            next()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json(sanitizeBookmark(res.bookmark))
    })
    .delete((req, res, next) => {
        bookmarksServices.deleteBookmark(
            req.app.get('db'),
            req.params.id
        )
        .then(() => {
            res.status(204).end()
        })
        .catch(next)
    })
    .patch(bodyParser, (req, res, next) => {
        const { title, url, description, rating } = req.body
        const bookmarkToUpdate = { title, url, description, rating }
        
        const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
        if(numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'title', 'url', 'description' or 'rating'`
                }
            })
        }
        
        bookmarksServices.updateBookmark(
            req.app.get('db'),
            req.params.id,
            bookmarkToUpdate
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })

module.exports = bookmarkRouter