import { DEFAULT_VISIBLE_MODELS } from "../../handlers/getModelDisplayName";
import { deriveToolPreferences, type ThreadToolPreferences } from "./deriveToolPreferences";

interface HandleStorageChangeParams {
  setToolPreferences: (updater: (prev: ThreadToolPreferences) => ThreadToolPreferences) => void;
}

export function handleStorageChange({
  setToolPreferences,
}: HandleStorageChangeParams): void {
  try {
    const saved = localStorage.getItem("toolPreferences");
    if (saved) {
      const parsed = JSON.parse(saved);
      const updatedPrefs = deriveToolPreferences(parsed);
      setToolPreferences(prevPrefs => {
        // Compare visibleModels specifically since that's what changes in settings
        const prevVisibleModels = prevPrefs.visibleModels || DEFAULT_VISIBLE_MODELS;
        const newVisibleModels = updatedPrefs.visibleModels || DEFAULT_VISIBLE_MODELS;
        const visibleModelsChanged = JSON.stringify([...prevVisibleModels].sort()) !== JSON.stringify([...newVisibleModels].sort());
        
        // Also check other key properties that might change
        const otherPropsChanged = 
          prevPrefs.model_provider !== updatedPrefs.model_provider ||
          prevPrefs.model_id !== updatedPrefs.model_id;
        
        if (visibleModelsChanged || otherPropsChanged) {
          return updatedPrefs;
        }
        return prevPrefs;
      });
    }
  } catch {}
}
