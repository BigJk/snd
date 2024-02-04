// Dither script that will be injected into the templates to dynamically dither img tags.
export default `
<script>
  /*
   * floyd-steinberg
   *
   * Using 2D error diffusion formula published by Robert Floyd and Louis Steinberg in 1976
   *
   * Javascript implementation of Floyd-Steinberg algorithm thanks to Forrest Oliphant @forresto and @meemoo 
   * via iFramework https://github.com/meemoo/iframework/blob/master/src/nodes/image-monochrome-worker.js
   *
   * Accepts an object that complies with the HTML5 canvas imageData spec https://developer.mozilla.org/en-US/docs/Web/API/ImageData
   * In particular, it makes use of the width, height, and data properties
   *
   * License: MIT
  */
  function floyd_steinberg(image, threshold) {
    threshold = threshold || 150;
    
    let imageData = image.data;
    let imageDataLength = imageData.length;
    let w = image.width;
    let lumR = [],
        lumG = [],
        lumB = [];

    let newPixel, err;

    for (let i = 0; i < 256; i++) {
      lumR[i] = i * 0.299;
      lumG[i] = i * 0.587;
      lumB[i] = i * 0.110;
    }

    // Greyscale luminance (sets r pixels to luminance of rgb)
    for (let i = 0; i <= imageDataLength; i += 4) {
      imageData[i] = Math.floor(lumR[imageData[i]] + lumG[imageData[i+1]] + lumB[imageData[i+2]]);
    }

    for (let currentPixel = 0; currentPixel <= imageDataLength; currentPixel += 4) {
      // threshold for determining current pixel's conversion to a black or white pixel
      newPixel = imageData[currentPixel] < threshold ? 0 : 255;
      err = Math.floor((imageData[currentPixel] - newPixel) / 23);
      imageData[currentPixel + 0 * 1 - 0 ] = newPixel;
      imageData[currentPixel + 4 * 1 - 0 ] += err * 7;
      imageData[currentPixel + 4 * w - 4 ] += err * 3;
      imageData[currentPixel + 4 * w - 0 ] += err * 5;
      imageData[currentPixel + 4 * w + 4 ] += err * 1;
      // Set g and b values equal to r (effectively greyscales the image fully)
      imageData[currentPixel + 1] = imageData[currentPixel + 2] = imageData[currentPixel];
    }

    return image;
  }
  
  // find all img tags that contain the dither attribute and run the dither on it with the given scale.
  document.querySelectorAll('img').forEach(img => {
    if (!img.getAttribute('dither')) {
      return;
    }
    
    if (img.getAttribute('src')[0] !== '/' && img.getAttribute('src').indexOf('data') !== 0) {
      img.setAttribute('src', '/proxy/' + img.getAttribute('src'))
    }
  
    img.addEventListener('load', () => {
      	let dither_scale = parseInt(img.getAttribute('dither'));	
        let dither_threshold = img.getAttribute('dither-threshold') ? parseInt(img.getAttribute('dither-threshold')) : undefined;
        
  		  let canvas = document.createElement('canvas');
        canvas.width = img.width / dither_scale;
        canvas.height = img.height / dither_scale;

        let context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, img.width / dither_scale, img.height / dither_scale);
  		  context.imageSmoothingEnabled = false;

        context.putImageData(floyd_steinberg(context.getImageData(0, 0, img.width / dither_scale, img.height / dither_scale), dither_threshold), 0, 0);
        img.src = canvas.toDataURL();
    }, { once: true })
  });
</script>
`;
