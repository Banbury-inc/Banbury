import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/20/solid';
import { DocumentIcon } from '@heroicons/react/24/outline';

const steps = [
  { name: 'Initiating', description: 'Starting the download process', status: 'idle' },
  { name: 'Preparing File', description: 'Getting your file ready', status: 'idle' },
  { name: 'Ready for Download', description: 'Your file is ready to download', status: 'idle' },
] as const;

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function FileDownload() {
  const [currentStep, setCurrentStep] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'preparing' | 'ready' | 'error'>('idle');

  const handleDownload = async () => {
    try {
      setDownloadStatus('preparing');
      
      // Step 1: Initiating
      setCurrentStep(0);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Preparing File
      setCurrentStep(1);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 3: Ready for Download
      setCurrentStep(2);
      setDownloadStatus('ready');
      
    } catch (error) {
      setDownloadStatus('error');
      console.error('Download failed:', error);
    }
  };

  const getStepStatus = (stepIdx: number) => {
    if (downloadStatus === 'error') return 'error';
    if (stepIdx < currentStep) return 'complete';
    if (stepIdx === currentStep) return downloadStatus === 'ready' ? 'complete' : 'current';
    return 'upcoming';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex flex-col items-center gap-8 p-8">
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <DocumentIcon className="h-16 w-16 text-zinc-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              example-document.pdf
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              24.5 MB
            </p>
          </div>

          <div className="w-full border-t border-zinc-800" />
          
          <nav aria-label="Progress" className="w-full">
            <ol role="list" className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className={classNames(
                  stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : '',
                  'relative flex-1'
                )}>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center">
                      {getStepStatus(stepIdx) === 'complete' ? (
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white">
                          <CheckIcon className="h-5 w-5 text-black" />
                        </span>
                      ) : getStepStatus(stepIdx) === 'current' ? (
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/50 bg-zinc-900">
                          <span className="h-2.5 w-2.5 rounded-full bg-white" />
                        </span>
                      ) : (
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-900">
                          <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col items-center text-center">
                      <span className={classNames(
                        'text-sm font-medium',
                        getStepStatus(stepIdx) === 'current' ? 'text-white' : 'text-zinc-200'
                      )}>
                        {step.name}
                      </span>
                      <span className="mt-1 text-sm text-zinc-400">
                        {step.description}
                      </span>
                    </div>
                  </div>

                  {stepIdx !== steps.length - 1 && (
                    <div
                      className={classNames(
                        'absolute left-0 top-4 h-0.5 w-full',
                        getStepStatus(stepIdx) === 'complete' ? 'bg-white' : 'bg-zinc-700'
                      )}
                      style={{ transform: 'translateX(8rem)' }}
                    />
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <div className="text-center text-sm text-zinc-300 mt-8">
            {downloadStatus === 'idle' && 'Click the button to start download'}
            {downloadStatus === 'preparing' && steps[currentStep].description}
            {downloadStatus === 'ready' && 'Your file is ready!'}
            {downloadStatus === 'error' && 'An error occurred. Please try again.'}
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloadStatus === 'preparing'}
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black shadow-lg transition-all hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:bg-zinc-800 disabled:text-zinc-400"
          >
            {downloadStatus === 'preparing' ? 'Preparing...' : 'Download File'}
          </button>
        </div>
      </div>
    </div>
  );
}