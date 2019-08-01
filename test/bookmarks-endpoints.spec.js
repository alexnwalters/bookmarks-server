const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe.only('Bookmarks Endpoints', function() {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe(`Get /bookmarks`, () => {
        context(`Given no bookmarks`, () => {
            it(`response with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, [])
            })
        })
        
        context('Given there are bookmarks in the database', () => {
            const testbookmarks = makeBookmarksArray()

            beforeEach('Insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testbookmarks)
            })

            it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
                var authToken = 'Bearer ' + process.env.API_TOKEN;
                
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', authToken)
                    .expect(200, testbookmarks)
            })
        })
    })

    describe(`Get /bookmarks/:bookmarkId`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 12345
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {error: { message: `Bookmark doesn't exist`}})
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testbookmarks = makeBookmarksArray()

            beforeEach('Insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testbookmarks)
            })

            it('GET /bookmarks/:bookmarks responds with 200 and all of the bookmarks', () => {
                var authToken = 'Bearer ' + process.env.API_TOKEN;
                const bookmarkId = 2
                const expectedBookmark = testbookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', authToken)
                    .expect(200, expectedBookmark)
            })
        })
    })
})