const fs = require('fs');
const gm = require('gm').subClass({imageMagick: true});
const request = require('request');
const rimraf = require('rimraf')

const aws = require('./aws')

const dir = './tmp';

const createMontage = (images, id) => {

  return new Promise((resolve, reject) => {

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    const promises = images.map((url, i) => {
      return new Promise((resolve) => {
        gm(request(url)).gravity('Center').crop(640, 640).resize(i >=2 ? 426.666667 : 640).write(`./tmp/image${i}.jpeg`, (err) => {
          if (!err) console.log(`image ${i} done`)
          resolve()
        })
      })
    })

    Promise.all(promises)
      .then(() => {
        Promise.all([
          new Promise((resolve) => {
            gm('./tmp/image0.jpeg').append('./tmp/image1.jpeg', true).write('./tmp/topRow.jpeg', (err) => {
              if (!err) console.log(`top row done`)
              resolve()
            })
          }),
          new Promise((resolve) => {
            gm('./tmp/image2.jpeg').append('./tmp/image3.jpeg', './tmp/image4.jpeg', true).write('./tmp/bottomRow.jpeg', (err) => {
              if (!err) console.log(`bottom row done`)
              // console.error(err)
              resolve()
            })
          }),
        ]).then(() => {
          gm('./tmp/topRow.jpeg').append('./tmp/bottomRow.jpeg', false).write('./tmp/montage.jpeg', (err) => {
            const path = `./tmp/chart-${id}.jpeg`;
            if (err) console.log(err);
            fs.rename('./tmp/montage.jpeg', path, (err) => {
              if ( err ) console.log('ERROR: ' + err);
              aws('hipcharts', path)
                .then((url) => {
                  rimraf('./tmp', () => {
                    console.log('tmp folder deleted')
                  })
                  resolve(url)
                })
            })
          })
        })
      })

  })
}

module.exports = createMontage
