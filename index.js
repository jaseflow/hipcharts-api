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

const db = require('./db')
const createMontage = require('./montage')

const resultsLimit = 5

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

function newToken() {
  request.post(authOptions, (err, response, body) => {
    if (!err && response.statusCode == 200) {
      spotifyApi.setAccessToken(body.access_token)
    }
  })
}

// Get first token
newToken();

// Get a new token every hour
setInterval(newToken, 1000 * 60 * 60);

// use modules
app.use(bodyParser.json())
app.use(cors({ origin: '*' }))
app.options('*', cors());  // enable pre-flight

// routes
app.post('/charts', (req, res) => {
  let sql = "INSERT INTO CHART (name, query) VALUES (?, ?)"
  const { name, query } = req.body;

  let values = [
    name,
    query,
  ]

  db.query(sql, values, (err, data) => {
    if (err) {
      console.log(err);
    }
    res.status(200).send(data);
  });
})

app.get('/charts', (req, res) => {
  let sql = 'SELECT * FROM CHART'
  db.query(sql, (err, data, fields) => {
    if (err) throw err
    res.json({
      status: 200,
      data,
      message: 'All charts retreived successfully'
    })
  })
})

app.get('/user-charts', (req, res) => {
  let sql = 'SELECT * FROM user_chart'
  db.query(sql, (err, data, fields) => {
    if (err) throw err
    res.json({
      status: 200,
      data,
      message: 'All user-charts retreived successfully'
    })
  })
})

app.get('/user-charts/:id', (req, res) => {
  const id = req.params.id
  let sql = `SELECT * FROM user_chart where id = ${id}`
  db.query(sql, (err, data, fields) => {
    if (err) throw err
    res.json({
      status: 200,
      data,
      message: `Successfully received user-chart ${id}`
    })
  })
})

app.patch('/user-charts/:id', (req, res) => {
  const id = req.params.id;
  const cosigns = req.body && req.body.cosigns;

  if (!cosigns && cosigns !== 'number') {
    return
  } else {
    let sql = `
      UPDATE user_chart
        SET cosigns = ${cosigns}
        WHERE id = ${id}
    `;
    db.query(sql, (err, data, fields) => {
      if (err) {
        console.log(err)
      }
      res.status(200).send(data);
    })
  }
})

app.post('/user-charts', (req, res) => {
  let sql = "INSERT INTO user_chart (type, items, author, cosigns) VALUES (?, ?, ?, ?)"
  const { type, items, author } = req.body;
  let images = []

  let values = [
    type,
    items,
    author,
    0
  ]
  db.query(sql, values, (err, data) => {
    const id = data.insertId;
    if (err) {
      console.log(err);
    }

    request.get(`${process.env.API_URL}/${type}?ids=${items}`, (err, response) => {
      if (!err && response.statusCode == 200) {
        const items = JSON.parse(response.body);

        for (let i = 0; i < items.length; i++) {
          images.push(items[i].images[0].url);
        }

        createMontage(images, id)
          .then((url) => {
            let sql = "UPDATE user_chart set montage=? where id=?"
            db.query(sql, [url, id], (err, data, fields) => {
              if (err) {
                console.log(err)
                return
              }
              console.log('Saved montage URL');
            })
          })
      } else {
        console.log('Error accessing item metadata URL');
      }
    })

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

app.get('/search', (req, res) => {
  //search?type=album&artist=Drake&period=all-time&q=Query
  const { type, artist, period, q } = req.query;
  let searchQuery;
  if (artist) {
    searchQuery = artist + ' ' + q
  } else {
    searchQuery = q
  }
  spotifyApi.search(searchQuery, [type], {limit: resultsLimit})
    .then((data) => {
      const typeKey = type + 's';
      const results = data.body[typeKey].items;
      const uniqResults = uniqBy(results, 'name')
      const uniqResultsWithImages = uniqResults.filter((r) => {
        if (r.images && r.images.length) {
          return true
        } else {
          return false
        }
      })
      if (uniqResults.length) {
        res.status(200).send(uniqResults)
      } else {
        res.status(200).send(null)
      }
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
      console.log('Error searching albums', err);
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
      console.log('Error searching artists', err);
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
