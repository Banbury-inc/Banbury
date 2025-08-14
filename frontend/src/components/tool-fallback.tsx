import { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Wrench } from "lucide-react";
import ToolCallCard from "./ToolCallCard";

export const ToolFallback: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
}) => {
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
