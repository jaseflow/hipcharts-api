const express = require('express')
const cors = require('cors')
const mysql = require('mysql')
const bodyParser = require('body-parser')

const SpotifyWebApi = require('spotify-web-api-node')
const request = require('request')

const app = express()

db = mysql.createConnection({
  host: 'localhost',
  user: 'hipcharts',
  password: '',
  database: 'hipcharts'
})

const server = {
  port: 4040
}

const client_id = 'bbe2d8fef3624522ab3cd08c5934e6bb'
const client_secret = 'ad74887dd6b24d20b3af20dd81bd778a'

let spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: client_secret
})

const authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
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
app.use(cors())
app.use(bodyParser.json())

// routes
app.get('/:id', (req, res) => {
  const id = req.params.id
  let sql = `SELECT * FROM charts where id = ${id}`
  db.query(sql, (err, data, fields) => {
    if (err) throw err
    res.json({
      status: 200,
      data,
      message: `Successfully received chart ${id}`
    })
  })
})

app.get('/all', (req, res) => {
  let sql = `SELECT * FROM charts`
  db.query(sql, (err, data, fields) => {
    if (err) throw err
    res.json({
      status: 200,
      data,
      message: 'All charts retreived successfully'
    })
  })
})

app.post('/new', (req, res) => {
  let sql = `INSERT INTO charts(type, artist, items) VALUES (?)`
  let values = [
    req.body.type,
    req.body.artist || null,
    req.body.items
  ]
  db.query(sql, [values], (err, data, fields) => {
    if (err) throw err
    res.json({
      status: 200,
      message: 'New chart added succesfully'
    })
  })
})

app.get('/search/artist', (req, res) => {
  const artist = req.query.artist
  console.log(spotifyApi)
  spotifyApi.searchArtists(artist)
    .then((data) => {
      console.log('Artist information', data.body)
      const results = data.body.artists.items
      if (results.length) {
        res.status(200).send(results)
      } else {
        res.status(200).send(null)
      }
    }).catch((err) => {
      res.send(err)
    })
})

app.get('/search/track', (req, res) => {
  const artist = req.query.artist
  spotifyApi.searchArtists(artist)
    .then((data) => {
      console.log('Artist information', data.body)
      const results = data.body.artists.items
      if (results.length) {
        res.status(200).send(results)
      } else {
        res.status(200).send(null)
      }
    }).catch((err) => {
      res.send(err)
    })
})

app.listen(server.port, () => {
  console.log(`Server started, listening on port ${server.port}`)
})
