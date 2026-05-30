import { useState } from "react";
import Toolbar from "./components/Toolbar";
import Canvas from "./components/Canvas";
import StatusBar from "./components/StatusBar";
import ChannelPanel from "./components/ChannelPanel";
import LevelsDialog from "./components/LevelsDialog";
import { useImageStore } from "./hooks/useImageStore";

export default function App() {
  const {
    originalImageData,
    displayImageData,
    imageInfo,
    scale,
    setScale,
    loadImage,
    clearImage,
    enabledChannels,
    toggleChannel,
    channelThumbs,
    showChannels,
    toggleChannels,
    activeTool,
    toggleEyedropper,
    pickedPixel,
    setPickedPixel,
    closePicker,
    updateDisplay,
    applyLevelsResult,
  } = useImageStore();

  const [levelsOpen, setLevelsOpen] = useState(false);

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

      <StatusBar imageInfo={imageInfo} scale={scale} />

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
    </div>
  );
}
