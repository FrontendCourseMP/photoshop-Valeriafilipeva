import Toolbar  from './components/Toolbar';
import Canvas   from './components/Canvas';
import StatusBar from './components/StatusBar';
import { useImageStore } from './hooks/useImageStore';

export default function App() {
  const {
    originalImageData,
    displayImageData,
    imageInfo,
    scale,
    setScale,
    loadImage,
    clearImage,
  } = useImageStore();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Toolbar
        onImageLoad={loadImage}
        onClear={clearImage}
        imageData={originalImageData}
        imageInfo={imageInfo}
      />

      {/* Сюда в лаб 2 добавится боковая панель каналов */}
      <div className="flex flex-1 overflow-hidden">
        <Canvas
          displayImageData={displayImageData}
          scale={scale}
          onScaleChange={setScale}
        />
        {/* <ChannelPanel /> */}
      </div>

      <StatusBar imageInfo={imageInfo} scale={scale} />
    </div>
  );
}