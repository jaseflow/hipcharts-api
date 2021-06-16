const fs = require('fs');
const gm = require('gm').subClass({imageMagick: true});
const request = require('request');

const dir = './tmp';

const createMontage = (images) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    const promises = images.map((url, i) => {
        return new Promise((resolve) => {
            gm(request(url)).write(`./tmp/image${i}.jpeg`, (err) => {
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
                    if (err) console.log(err);
                    console.log('MONTAGE DONE')
                })
            })
        })
}

// createMontage([
//     'https://i.scdn.co/image/ab6761610000e5eb573d24167a5133632613bed0',
//     'https://i.scdn.co/image/a02c89d6abef58ad10832020c06f6a8a38dd9a32',
//     'https://i.scdn.co/image/ab67616d0000b273de3c04b5fc750b68899b20a9',
//     'https://i.scdn.co/image/2fe4e2b96816f48a1af8545960dfaf4cb16c71bd',
//     'https://i.scdn.co/image/e9c7d7e446f19d445898eb362417542b134863af'
// ])

module.exports = createMontage
