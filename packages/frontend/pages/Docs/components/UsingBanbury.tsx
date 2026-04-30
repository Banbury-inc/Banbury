import DocPageLayout from './DocPageLayout';
import { Typography } from '../../../components/common/ui/typography';
import {
  MockComposerBasic,
  MockComposerWithFile,
  MockComposerWithToolsOpen,
} from './MockComposerForDocs';

interface StepIndicatorProps {
  stepNumber: number;
}

function StepIndicator({ stepNumber }: StepIndicatorProps) {
  return (
    <div className="mr-2 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-border bg-muted/50">
      <Typography variant="small" className="font-semibold">
        {stepNumber}
      </Typography>
    </div>
  );
}

interface PromptBoxProps {
  text: string;
}

function PromptBox({ text }: PromptBoxProps) {
  return (
    <div className="mb-3 max-w-[400px]">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-2 py-1">
          <Typography
            variant="xs"
            className="font-medium uppercase tracking-wider text-muted-foreground"
          >
            Example Prompt
          </Typography>
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2 rounded-full bg-destructive/60" />
            <span className="size-2 rounded-full bg-chart-4/60" />
            <span className="size-2 rounded-full bg-chart-2/60" />
          </div>
        </div>
        {/* Content */}
        <div className="p-2">
          <Typography
            variant="p"
            className="break-words font-mono leading-relaxed text-foreground/90 [&:not(:first-child)]:mt-0"
          >
            {text}
          </Typography>
        </div>
      </div>
    </div>
  );
}

export default function UsingBanburyTab() {
  return (
    <DocPageLayout>
      <Typography variant="h2" className="mb-3">
        Using Banbury
      </Typography>
      <Typography variant="p" className="mb-4">
        This guide will walk you through Banbury—covering everything from basic functionalities to unlocking its full potential. 
        With step-by-step instructions and practical tips, learn how to leverage Banbury to simplify tasks and enhance productivity.
      </Typography>

      <Typography variant="h3" id="using-chat" className="mb-4">
        Using Chat
      </Typography>

      {/* Step 1 */}
      <div className="mb-4 border-border pl-0 md:border-l-2 md:pl-2">
        <div className="mb-2 flex items-center">
          <StepIndicator stepNumber={1} />
          <Typography variant="h4" id="web-research">
            Web Research
          </Typography>
        </div>
        
        <div className="pl-0 md:pl-11">
          <Typography variant="p" className="mb-3">
            In the Chat window, type the following prompt and press Enter.
          </Typography>
          
          <PromptBox text="Search the web for latest NFL news." />
          
          <div className="mb-3">
            <MockComposerBasic />
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="mb-4 border-border pl-0 md:border-l-2 md:pl-2">
        <div className="mb-2 flex items-center">
          <StepIndicator stepNumber={2} />
          <Typography variant="h4" id="draft-report">
            Draft a report
          </Typography>
        </div>
        
        <div className="pl-0 md:pl-11">
          <Typography variant="p" className="mb-3">
            Type the following prompt and press Enter.
          </Typography>
          
          <PromptBox text="Create a new document with a summary of your results." />
          
          <div className="mb-3">
            <MockComposerBasic />
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="mb-4 border-border pl-0 md:border-l-2 md:pl-2">
        <div className="mb-2 flex items-center">
          <StepIndicator stepNumber={3} />
          <Typography variant="h4" id="attach-files">
            Attach Files
          </Typography>
        </div>
        
        <div className="pl-0 md:pl-11">
          <Typography variant="p" className="mb-3">
            You can attach files to your prompts by clicking the attachment icon in the composer or simply opening a file in the left panel.
          </Typography>
          
          <div className="mb-3">
            <MockComposerWithFile />
          </div>
        </div>
      </div>

      {/* Step 4 */}
      <div className="mb-4 border-border pl-0 md:border-l-2 md:pl-2">
        <div className="mb-2 flex items-center">
          <StepIndicator stepNumber={4} />
          <Typography variant="h4" id="toggle-tools">
            Toggle Tools
          </Typography>
        </div>
        
        <div className="pl-0 md:pl-11">
          <Typography variant="p" className="mb-3">
            Enable or disable specific tools in the composer to customize Banbury's capabilities for your task.
          </Typography>
          
          <div className="mb-3">
            <MockComposerWithToolsOpen />
          </div>
        </div>
      </div>
    </DocPageLayout>
  );
}
