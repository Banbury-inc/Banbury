import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { downloadFile } from '../handlers/downloadFile';
import { getFileInfo } from '../handlers/getFileInfo';

const steps = [
  { name: 'Initiating', description: '', status: 'idle' },
  { name: 'Getting device info', description: '', status: 'idle' },
  { name: 'Looking to see if device is online', description: '', status: 'idle' },
  { name: 'Sending download request', description: '', status: 'idle' },
  { name: 'Preparing file', description: '', status: 'idle' },
  { name: 'File ready', description: '', status: 'idle' },
] as const;

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function FileDownload() {
  const router = useRouter();
  const { username, file_id } = router.query as { username?: string; file_id?: string };
  const [currentStep, setCurrentStep] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'preparing' | 'ready' | 'error'>('idle');
  const [fileInfo, setFileInfo] = useState<any>();
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [errorStep, setErrorStep] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const fetchFileInfo = async () => {
      setDownloadStatus('preparing');
      setCurrentStep(0);
      setErrorStep(null);
      setErrorMessage('');
      
      try {
        const fileInfo = await getFileInfo(username, file_id);
        if (fileInfo) {
          setFileInfo(fileInfo);
          const blob = await downloadFile(username, fileInfo, (step, error?) => {
            setCurrentStep(step);
            if (error) {
              setErrorStep(step);
              setErrorMessage(error);
              setDownloadStatus('error');
            }
          });
          if (blob) {
            setFileBlob(blob);
            setCurrentStep(5);
            setDownloadStatus('ready');
          }
        }
      } catch (error) {
        setDownloadStatus('error');
      }
    };
    fetchFileInfo();
  }, [username, file_id]);

  const initiateDownload = () => {
    if (fileBlob && fileInfo) {
      const url = window.URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const getStepStatus = (stepIdx: number) => {
    if (errorStep === stepIdx) return 'error';
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
              {fileInfo?.file_name}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {fileInfo?.file_size} MB
            </p>
          </div>

          <div className="w-full border-t border-zinc-800" />
          
          <nav aria-label="Progress" className="w-full">
            <ol role="list" className="flex items-start">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className={classNames(
                  stepIdx !== steps.length - 1 ? 'pr-6 sm:pr-12' : '',
                  'relative flex-1'
                )}>
                  <div className="flex flex-col items-center pt-2">
                    <div className="flex items-center justify-center">
                      {getStepStatus(stepIdx) === 'complete' ? (
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white">
                          <CheckIcon className="h-5 w-5 text-black" />
                        </span>
                      ) : getStepStatus(stepIdx) === 'error' ? (
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-600">
                          <XMarkIcon className="h-5 w-5 text-white" />
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

                    <div className="absolute top-6 -right-12 w-[calc(100%+1rem)]">
                      {stepIdx !== steps.length - 1 && (
                        <div
                          className={classNames(
                            'h-0.5 w-full',
                            getStepStatus(stepIdx) === 'complete' ? 'bg-white' : 'bg-zinc-700'
                          )}
                        />
                      )}
                    </div>

                    <div className="mt-4 flex flex-col items-center text-center min-h-[4rem]">
                      <span className={classNames(
                        'text-sm font-medium',
                        getStepStatus(stepIdx) === 'current' ? 'text-white' : 'text-zinc-200'
                      )}>
                        {step.name}
                      </span>
                      <span className="mt-1 text-sm text-zinc-400">
                        {errorStep === stepIdx ? errorMessage : step.description}
                      </span>
                    </div>
                  </div>
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
            onClick={initiateDownload}
            disabled={!fileBlob || downloadStatus === 'preparing'}
            className={`btn-download ${(!fileBlob || downloadStatus === 'preparing') ? 'btn-download-disabled' : ''}`}
          >
            {downloadStatus === 'preparing' ? 'Preparing...' : 
             !fileBlob ? 'Loading...' : 'Download File'}
          </button>
        </div>
      </div>
    </div>
  );
}