const express = require('express')
const cors = require('cors')
const mysql = require('mysql2')
const bodyParser = require('body-parser')

const SpotifyWebApi = require('spotify-web-api-node')
const request = require('request')

const app = express()

const uniqBy = require('lodash.uniqby')

const dotenv = require('dotenv')
dotenv.config();

db = mysql.createConnection(process.env.DATABASE_URL)

db.connect((err) => {
  if (err) {
    console.log('Error code: ', err.code);
    console.log('Error query was: ', err.sql);
    console.log('Error message: ', err.sqlMessage);
  }
})

const resultsLimit = 8

const server = {
  port: 4040
}

const client_id = 'bbe2d8fef3624522ab3cd08c5934e6bb'
const client_secret = process.env.SPOTIFY_CLIENT_SECRET

let spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: client_secret
})

const authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
  },
  form: {
    grant_type: 'client_credentials',
  },
  json: true
}

request.post(authOptions, (err, response, body) => {
  if (!err && response.statusCode == 200) {
    spotifyApi.setAccessToken(body.access_token)
  }
})

// use modules
app.use(bodyParser.json())
app.use(cors())
app.options('*', cors());  // enable pre-flight

// routes
app.get('/chart/:id', (req, res) => {
  const id = req.params.id
  let sql = `SELECT * FROM chart where id = ${id}`
  db.query(sql, (err, data, fields) => {
    if (err) throw err
    res.json({
      status: 200,
      data,
      message: `Successfully received chart ${id}`
    })
  })
})

app.get('/charts/all', (req, res) => {
  let sql = 'SELECT * FROM chart'
  db.query(sql, (err, data, fields) => {
    if (err) throw err
    res.json({
      status: 200,
      data,
      message: 'All charts retreived successfully'
    })
  })
})

app.post('/charts/new', (req, res) => {
  let sql = "INSERT INTO chart (type, items, author) VALUES (?, ?, ?)"
  let values = [
    req.body.type,
    req.body.items,
    req.body.author,
  ]
  db.query(sql, values, (err, data) => {
    if (err) throw err
    res.status(200).send(data);
  })
})

app.get('/albums', (req, res) => {
  const ids = req.query.ids
  const items = ids.split("|");
  spotifyApi.getAlbums(items, { limit: resultsLimit })
    .then((data) => {
      const results = data.body.albums
      if (results.length) {
        res.status(200).send(results)
      } else {
        res.status(200).send(null)
      }
    }).catch((err) => {
      res.send(err)
    })
})

app.get('/artists', (req, res) => {
  const ids = req.query.ids
  const items = ids.split("|");
  spotifyApi.getArtists(items)
    .then((data) => {
      const results = data.body.artists
      if (results.length) {
        res.status(200).send(results)
      } else {
        res.status(200).send(null)
      }
    }).catch((err) => {
      res.send(err)
    })
})

app.get('/search/albums', (req, res) => {
  const album = req.query.album
  spotifyApi.search(album, ['album'], { limit: resultsLimit })
    .then((data) => {
      const results = data.body.albums.items
      const uniqResults = uniqBy(results, 'name')
      const uniqResultsWithImages = uniqResults.filter((r) => {
        if (r.images.length) {
          return true
        } else {
          return false
        }
      })
      if (results.length) {
        res.status(200).send(uniqResultsWithImages)
      } else {
        res.status(200).send(null)
      }
    }).catch((err) => {
      res.send(err)
    })
})

app.get('/search/artists', (req, res) => {
  const artist = req.query.artist
  spotifyApi.searchArtists(artist, { limit: resultsLimit })
    .then((data) => {
      const results = data.body.artists.items
      const uniqResults = uniqBy(results, 'name')
      const uniqResultsWithImages = uniqResults.filter((r) => {
        if (r.images.length) {
          return true
        } else {
          return false
        }
      })
      if (results.length) {
        res.status(200).send(uniqResultsWithImages)
      } else {
        res.status(200).send(null)
      }
    }).catch((err) => {
      res.send(err)
    })
})

app.get('/search/tracks', (req, res) => {
  const track = req.query.track
  const artist = req.query.artist
  let query 

  if (artist && artist.length) {
    query = `track: ${track} artist: ${artist}`
  } else {
    query = track
  }

  spotifyApi.searchTracks(query, { limit: resultsLimit })
    .then((data) => {
      const results = data.body.tracks.items
      if (results.length) {
        res.status(200).send(results)
      } else {
        res.status(200).send(null)
      }
    }).catch((err) => {
      res.send(err)
    })
})

app.listen(process.env.PORT || server.port, () => {
  console.log(`Server started, listening on port ${server.port}`)
})
