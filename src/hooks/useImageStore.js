import { useState, useCallback, useRef } from 'react';
import { applyChannels, makeChannelThumbsAsync } from '../lib/colorSpaces';

const DEFAULT_CHANNELS = { R: true, G: true, B: true, A: true };

export function useImageStore() {
  const [originalImageData, setOriginalImageData] = useState(null);
  const [displayImageData,  setDisplayImageData]  = useState(null);
  const [imageInfo,         setImageInfo]          = useState(null);
  const [scale,             setScale]              = useState(1.0);

  const [enabledChannels, setEnabledChannels] = useState(DEFAULT_CHANNELS);
  const [channelThumbs,   setChannelThumbs]   = useState({});
  const [showChannels,    setShowChannels]    = useState(false);

  const [activeTool,  setActiveTool]  = useState('none');
  const [pickedPixel, setPickedPixel] = useState(null);

  const originalRef = useRef(null);

  const loadImage = useCallback((imageData, info) => {
    originalRef.current = imageData;
    setOriginalImageData(imageData);
    setDisplayImageData(imageData);
    setImageInfo(info);
    setEnabledChannels(DEFAULT_CHANNELS);
    setPickedPixel(null);
    setActiveTool('none');
    setChannelThumbs({});

    makeChannelThumbsAsync(imageData, (channel, dataUrl) => {
      setChannelThumbs(prev => ({ ...prev, [channel]: dataUrl }));
    });
  }, []);

  const clearImage = useCallback(() => {
    originalRef.current = null;
    setOriginalImageData(null);
    setDisplayImageData(null);
    setImageInfo(null);
    setScale(1.0);
    setEnabledChannels(DEFAULT_CHANNELS);
    setChannelThumbs({});
    setPickedPixel(null);
    setActiveTool('none');
    setShowChannels(false);
  }, []);

  const updateDisplay = useCallback((newImageData) => {
    setDisplayImageData(newImageData);
  }, []);

  const cloneOriginal = useCallback(() => {
    const orig = originalRef.current;
    if (!orig) return null;
    return new ImageData(new Uint8ClampedArray(orig.data), orig.width, orig.height);
  }, []);

  const toggleChannel = useCallback((ch) => {
    setEnabledChannels(prev => {
      const next = { ...prev, [ch]: !prev[ch] };
      const orig = originalRef.current;
      if (orig) {
        const allOn = next.R && next.G && next.B && next.A;
        requestAnimationFrame(() => {
          setDisplayImageData(allOn ? orig : applyChannels(orig, next));
        });
      }
      return next;
    });
  }, []);

  const toggleEyedropper = useCallback(() => {
    setActiveTool(prev => {
      if (prev === 'eyedropper') {
        setPickedPixel(null);
        return 'none';
      }
      return 'eyedropper';
    });
  }, []);

  const closePicker = useCallback(() => {
    setPickedPixel(null);
    setActiveTool('none');
  }, []);

  const toggleChannels = useCallback(() => {
    setShowChannels(prev => !prev);
  }, []);

  return {
    originalImageData,
    displayImageData,
    imageInfo,
    scale, setScale,
    loadImage,
    clearImage,
    updateDisplay,
    cloneOriginal,
    enabledChannels,
    toggleChannel,
    channelThumbs,
    showChannels,
    toggleChannels,
    activeTool, setActiveTool,
    toggleEyedropper,
    pickedPixel, setPickedPixel,
    closePicker,
  };
}