const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  title: String,
  img: {
    data: Buffer,
    contentType: String
  }
});

const Image = mongoose.model('Image', imageSchema);

// To save an image:
const fs = require('fs');
const imagePath = 'path/to/your/image.jpg';

fs.readFile(imagePath, (err, data) => {
  if (err) throw err;
  const newImage = new Image({
    title: 'Sample Image',
    img: {
      data: data,
      contentType: 'image/jpeg'
    }
  });
  newImage.save((err, savedImage) => {
    if (err) throw err;
    console.log('Image saved successfully:', savedImage);
  });
});
