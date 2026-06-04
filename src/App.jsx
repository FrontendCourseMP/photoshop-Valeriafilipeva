import { useState } from 'react';
import Toolbar      from './components/Toolbar';
import Canvas       from './components/Canvas';
import StatusBar    from './components/StatusBar';
import ChannelPanel from './components/ChannelPanel';
import LevelsDialog from './components/LevelsDialog';
import ResizeDialog from './components/ResizeDialog';
import { useImageStore } from './hooks/useImageStore';

export default function App() {
  const {
    originalImageData,
    displayImageData,
    imageInfo,
    scale, setScale,
    loadImage,
    clearImage,
    enabledChannels,
    toggleChannel,
    channelThumbs,
    showChannels,
    toggleChannels,
    activeTool,
    toggleEyedropper,
    pickedPixel, setPickedPixel,
    closePicker,
    updateDisplay,
    applyLevelsResult,
    resetToInitial
  } = useImageStore();

  const [levelsOpen, setLevelsOpen] = useState(false);
  const [resizeOpen, setResizeOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Toolbar
        onImageLoad={loadImage}
        onClear={clearImage}
        imageData={originalImageData}
        imageInfo={imageInfo}
        activeTool={activeTool}
        onToggleEyedropper={toggleEyedropper}
        showChannels={showChannels}
        onToggleChannels={toggleChannels}
        onOpenLevels={() => setLevelsOpen(true)}
        onOpenResize={() => setResizeOpen(true)}
        onReset={resetToInitial}  onReset={resetToInitial}
      />

      <div className="flex flex-1 overflow-hidden">
        <Canvas
          displayImageData={displayImageData}
          scale={scale}
          onScaleChange={setScale}
          activeTool={activeTool}
          onPickPixel={setPickedPixel}
          pickedPixel={pickedPixel}
          onClearPick={closePicker}
        />

        {showChannels && originalImageData && (
          <ChannelPanel
            imageData={originalImageData}
            enabledChannels={enabledChannels}
            onToggle={toggleChannel}
            channelThumbs={channelThumbs}
          />
        )}
      </div>

      <StatusBar
        imageInfo={imageInfo}
        scale={scale}
        onScaleChange={setScale}
      />

      <LevelsDialog
        isOpen={levelsOpen}
        onClose={() => setLevelsOpen(false)}
        originalImageData={originalImageData}
        onApply={(result) => {
          applyLevelsResult(result);
          setLevelsOpen(false);
        }}
        onPreview={updateDisplay}
        onCancelPreview={() => updateDisplay(originalImageData)}
      />

      <ResizeDialog
        isOpen={resizeOpen}
        onClose={() => setResizeOpen(false)}
        imageData={originalImageData}
        onApply={(result) => {
          applyLevelsResult(result);
          setResizeOpen(false);
        }}
      />
    </div>
  );
}