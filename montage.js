const fs = require('fs');
const gm = require('gm');
const request = require('request');

const dir = './tmp';

module.exports = (images) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const image1 = gm(request(images[0]))
    .write('./tmp/image1.jpeg', (err) => {
      if (!err) console.log('first one done')
    })

  const image2 = gm(request(images[1]))
    .write('./tmp/image2.jpeg', (err) => {
      if (!err) console.log('second one done')
    })

  const image3 = gm(request(images[2]))
    .resize(426)
    .write('./tmp/image3.jpeg', (err) => {
      if (!err) console.log('third one done')
    })

  const image4 = gm(request(images[3]))
    .resize(426)
    .write('./tmp/image4.jpeg', (err) => {
      if (!err) console.log('fourth one done')
    })

  const image5 = gm(request(images[4]))
    .resize(426)
    .write('./tmp/image5.jpeg', (err) => {
      if (!err) console.log('fifth one done')
    })

  // WTF? horrific code but it works
  setTimeout(() => {
    Promise.all([image1, image2, image3, image4, image5])
      .then(
        gm('./tmp/image1.jpeg').append('./tmp/image2.jpeg', true)
        .write('./tmp/topRow.jpeg', (err) => {
          if (err) console.log(err);
        })
      ).then(
        gm('./tmp/image3.jpeg').append('./tmp/image4.jpeg', './tmp/image5.jpeg', true)
        .write('./tmp/bottomRow.jpeg', (err) => {
          if (err) console.log(err);
        })
      ).then(
        gm('./tmp/topRow.jpeg').append('./tmp/bottomRow.jpeg', false)
        .write('./tmp/montage.jpeg', (err) => {
          if (err) console.log(err);
        })
      )
  }, 500)
}
