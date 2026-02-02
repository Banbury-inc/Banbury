import { FC } from "react";
import { Typography } from "../../../../ui/typography";
import { Button } from "../../../../ui/button";

interface SaveConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  onTitleChange: (title: string) => void;
}

export const SaveConversationDialog: FC<SaveConversationDialogProps> = ({ 
  open, 
  onClose, 
  onSave, 
  title, 
  onTitleChange 
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-zinc-200 dark:border-zinc-700">
        <Typography variant="h4" className="mb-4">Save Conversation</Typography>
        <input
          type="text"
          placeholder="Enter conversation title..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full p-2 bg-zinc-50 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!title.trim()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
