import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/20/solid';

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
    <div className="flex flex-col items-center gap-8 p-8">
      <nav aria-label="Progress" className="w-full max-w-4xl">
        <ol role="list" className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className={classNames(
              stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : '',
              'relative flex-1'
            )}>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center">
                  {getStepStatus(stepIdx) === 'complete' ? (
                    <span className="relative z-10 flex size-8 items-center justify-center rounded-full bg-indigo-600">
                      <CheckIcon className="size-5 text-white" />
                    </span>
                  ) : getStepStatus(stepIdx) === 'current' ? (
                    <span className="relative z-10 flex size-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white">
                      <span className="size-2.5 rounded-full bg-indigo-600" />
                    </span>
                  ) : (
                    <span className="relative z-10 flex size-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                      <span className="size-2.5 rounded-full bg-transparent" />
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-col items-center text-center">
                  <span className={classNames(
                    'text-sm font-medium',
                    getStepStatus(stepIdx) === 'current' ? 'text-indigo-600' : 'text-gray-500'
                  )}>
                    {step.name}
                  </span>
                  <span className="mt-1 text-sm text-gray-500">
                    {step.description}
                  </span>
                </div>
              </div>

              {stepIdx !== steps.length - 1 && (
                <div
                  className={classNames(
                    'absolute left-0 top-4 h-0.5 w-full',
                    getStepStatus(stepIdx) === 'complete' ? 'bg-indigo-600' : 'bg-gray-300'
                  )}
                  style={{ transform: 'translateX(8rem)' }}
                />
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="text-center text-sm text-gray-600 mt-8">
        {downloadStatus === 'idle' && 'Click the button to start download'}
        {downloadStatus === 'preparing' && steps[currentStep].description}
        {downloadStatus === 'ready' && 'Your file is ready!'}
        {downloadStatus === 'error' && 'An error occurred. Please try again.'}
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={downloadStatus === 'preparing'}
        className="rounded bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400"
      >
        {downloadStatus === 'preparing' ? 'Preparing...' : 'Download File'}
      </button>
    </div>
  );
}