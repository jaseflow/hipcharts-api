const express = require('express')
const cors = require('cors')
const mysql = require('mysql')
const bodyParser = require('body-parser')

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

// routers
const chartsRouter = require('./routes/charts')

// use modules
app.use(cors())
app.use(bodyParser.json())
// use router
app.use('/charts/', chartsRouter)

app.listen(server.port, () => {
  console.log(`Server started, listening on port ${server.port}`)
})
