const AWS = require('aws-sdk');

const aws = (bucket, file) => {

  return new Promise((resolve, reject) => {

    // Create S3 service object
    const s3 = new AWS.S3({apiVersion: '2006-03-01'});

    // call S3 to retrieve upload file to specified bucket
    const uploadParams = {Bucket: bucket, Key: '', Body: '', ACL: 'public-read'};

    // Configure the file stream and obtain the upload parameters
    const fs = require('fs');
    const fileStream = fs.createReadStream(file);
    fileStream.on('error', function(err) {
      console.log('File Error', err);
    });
    uploadParams.Body = fileStream;

    const path = require('path');
    uploadParams.Key = path.basename(file);

    // call S3 to retrieve upload file to specified bucket
    s3.upload (uploadParams, function (err, data) {
      if (err) {
        console.log("Error", err);
        reject();
      } if (data) {
        console.log("Upload Success", data.Location);
        resolve(data.Location);
      }
    });

  })

}

module.exports = aws;
