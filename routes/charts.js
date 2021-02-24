const express = require('express')

const router = express.Router()

// get single chart

router.get('/:id', (req, res) => {
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

// get all charts

router.get('/all', (req, res) => {
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

// create new user
router.post(`/new`, (req, res) => {
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

module.exports = router
