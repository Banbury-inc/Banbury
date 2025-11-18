interface FontHandlerParams {
  fontSize: number;
  setFontSize: (size: number) => void;
  applyCellStyle: (property: string, value: string) => void;
}

function createFontHandlers({
  fontSize,
  setFontSize,
  applyCellStyle
}: FontHandlerParams) {

  const handleFontSize = (newFontSize?: number) => {
    const fontSizeValue = newFontSize || fontSize;
    applyCellStyle('fontSize', `${fontSizeValue}px`);
  };

  const handleFontSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0 && value <= 72) {
      setFontSize(value);
      handleFontSize(value);
    }
  };

  const handleFontSizeIncrement = () => {
    const newSize = Math.min(fontSize + 1, 72);
    setFontSize(newSize);
    handleFontSize(newSize);
  };

  const handleFontSizeDecrement = () => {
    const newSize = Math.max(fontSize - 1, 6);
    setFontSize(newSize);
    handleFontSize(newSize);
  };

  return {
    handleFontSize,
    handleFontSizeChange,
    handleFontSizeIncrement,
    handleFontSizeDecrement
  };
}

export { createFontHandlers };
export type { FontHandlerParams };
