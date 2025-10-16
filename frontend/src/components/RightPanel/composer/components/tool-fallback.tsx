import { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { Wrench } from "lucide-react";
import ToolCallCard from "./ToolCallCard"

export const ToolFallback: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
}) => {
  // Dispatch a creation event when generate_image succeeds
  try {
    if (toolName === 'generate_image' && typeof result === 'string') {
      const parsed = JSON.parse(result);
      if (parsed?.ok && parsed?.file_info) {
        window.dispatchEvent(new CustomEvent('assistant-file-created', { detail: { result: parsed } }));
      }
    }
  } catch {}
  return (
    <ToolCallCard
      toolName={toolName}
      label={toolName.replace(/_/g, " ")}
      argsText={argsText}
      result={result}
      icon={<Wrench className="h-4 w-4 text-zinc-500" />}
    />
  );
};
