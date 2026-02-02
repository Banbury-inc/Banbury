import { FC } from "react";
import { FolderOpen, RefreshCwIcon, Trash2 } from "lucide-react";
import { Typography } from "../../../../ui/typography";
import { TooltipIconButton } from "../../../tooltip-icon-button";
import { Button } from "../../../../ui/button";

interface LoadConversationDialogProps {
  open: boolean;
  onClose: () => void;
  conversations: any[];
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export const LoadConversationDialog: FC<LoadConversationDialogProps> = ({ 
  open, 
  onClose, 
  conversations, 
  onLoadConversation, 
  onDeleteConversation 
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col shadow-xl border border-zinc-200 dark:border-zinc-700">
        <Typography variant="h4" className="mb-4">Load Conversation</Typography>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <Typography variant="muted" className="text-center py-8">No saved conversations found.</Typography>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Typography variant="h4" className="truncate">{conversation.title}</Typography>
                    <Typography variant="small" className="text-zinc-600 dark:text-zinc-400">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </Typography>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <TooltipIconButton
                      tooltip="Load conversation"
                      variant="ghost"
                      size="sm"
                      onClick={() => onLoadConversation(conversation._id)}
                    >
                      <FolderOpen className="h-4 w-4" strokeWidth={1} />
                    </TooltipIconButton>
                    <TooltipIconButton
                      tooltip="Refresh conversation display"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Force a refresh by reloading the conversation
                        onLoadConversation(conversation._id);
                      }}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <RefreshCwIcon className="h-4 w-4" strokeWidth={1} />
                    </TooltipIconButton>
                    <TooltipIconButton
                      tooltip="Delete conversation"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteConversation(conversation._id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1} />
                    </TooltipIconButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
