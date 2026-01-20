// Render decorative element
export function DecorativeElementRenderer({
  element
}: {
  element: {
    id: string;
    shape: 'circle' | 'rect' | 'line' | 'triangle' | 'blob';
    x: number;
    y: number;
    width?: number;
    height?: number;
    color: string;
    opacity: number;
    rotation?: number;
    scale?: number;
  };
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}%`,
    top: `${element.y}%`,
    opacity: element.opacity,
    transform: element.rotation
      ? `rotate(${element.rotation}deg) scale(${element.scale || 1})`
      : element.scale
        ? `scale(${element.scale})`
        : undefined,
    transformOrigin: 'center',
  };

  if (element.width !== undefined) {
    style.width = `${element.width}%`;
  }
  if (element.height !== undefined) {
    style.height = `${element.height}%`;
  }

  switch (element.shape) {
    case 'circle':
      return (
        <div
          style={{
            ...style,
            borderRadius: '50%',
            backgroundColor: element.color,
            width: element.width ? `${element.width}%` : '20%',
            height: element.height ? `${element.height}%` : '20%',
          }} />
      );

    case 'rect':
      return (
        <div
          style={{
            ...style,
            backgroundColor: element.color,
            width: element.width ? `${element.width}%` : '30%',
            height: element.height ? `${element.height}%` : '30%',
          }} />
      );

    case 'line':
      return (
        <div
          style={{
            ...style,
            backgroundColor: element.color,
            width: element.width ? `${element.width}%` : '100%',
            height: element.height ? `${element.height}%` : '2px',
            top: `${element.y}%`,
            left: `${element.x}%`,
          }} />
      );

    case 'triangle':
      return (
        <div
          style={{
            ...style,
            width: 0,
            height: 0,
            borderLeft: `${element.width ? element.width / 2 : 10}% solid transparent`,
            borderRight: `${element.width ? element.width / 2 : 10}% solid transparent`,
            borderBottom: `${element.height ? element.height : 15}% solid ${element.color}`,
            backgroundColor: 'transparent',
          }} />
      );

    case 'blob':
      // For blob, use a circle with border-radius for organic shape
      return (
        <div
          style={{
            ...style,
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            backgroundColor: element.color,
            width: element.width ? `${element.width}%` : '25%',
            height: element.height ? `${element.height}%` : '25%',
          }} />
      );

    default:
      return null;
  }
}
