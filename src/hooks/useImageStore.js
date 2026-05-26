import { useState, useCallback } from 'react';

export function useImageStore() {
  const [originalImageData, setOriginalImageData] = useState(null);
  const [displayImageData, setDisplayImageData]   = useState(null);
  const [imageInfo, setImageInfo]                 = useState(null);
  const [scale, setScale]                         = useState(1.0);

  const loadImage = useCallback((imageData, info) => {
    setOriginalImageData(imageData);
    setDisplayImageData(new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    ));
    setImageInfo(info);
  }, []);

  const clearImage = useCallback(() => {
    setOriginalImageData(null);
    setDisplayImageData(null);
    setImageInfo(null);
    setScale(1.0);
  }, []);

  const updateDisplay = useCallback((newImageData) => {
    setDisplayImageData(newImageData);
  }, []);

  return {
    originalImageData,
    displayImageData,
    imageInfo,
    scale,
    setScale,
    loadImage,
    clearImage,
    updateDisplay,
  };
}