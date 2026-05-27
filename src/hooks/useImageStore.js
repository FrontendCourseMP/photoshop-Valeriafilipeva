import { useState, useCallback, useRef } from 'react';

export function useImageStore() {
  const [originalImageData, setOriginalImageData] = useState(null);
  const [displayImageData, setDisplayImageData]   = useState(null);
  const [imageInfo, setImageInfo]                 = useState(null);
  const [scale, setScale]                         = useState(1.0);
  // Храним оригинал в ref чтобы не копировать лишний раз
  const originalRef = useRef(null);

  const loadImage = useCallback((imageData, info) => {
    originalRef.current = imageData;
    setOriginalImageData(imageData);
    // НЕ копируем — просто передаём ту же ссылку для отображения
    // Копия создаётся только когда реально нужно изменить (лаб 2-5)
    setDisplayImageData(imageData);
    setImageInfo(info);
  }, []);

  const clearImage = useCallback(() => {
    originalRef.current = null;
    setOriginalImageData(null);
    setDisplayImageData(null);
    setImageInfo(null);
    setScale(1.0);
  }, []);

  const updateDisplay = useCallback((newImageData) => {
    setDisplayImageData(newImageData);
  }, []);

  // Используется в лаб 2-5 когда нужна настоящая копия для изменений
  const cloneOriginal = useCallback(() => {
    const orig = originalRef.current;
    if (!orig) return null;
    return new ImageData(
      new Uint8ClampedArray(orig.data),
      orig.width,
      orig.height
    );
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
    cloneOriginal,
  };
}