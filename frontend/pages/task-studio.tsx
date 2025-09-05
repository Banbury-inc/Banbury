
import dynamic from 'next/dynamic';

const TaskStudio = dynamic(() => import('@/pages/TaskStudio/TaskStudio'), { ssr: false });

export default function TaskStudioPage() {
  return <TaskStudio />;
}
