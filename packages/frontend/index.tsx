import ReactDOM from 'react-dom/client';

import App from './App';
import { ClaudeRuntimeProvider } from './assistant/ClaudeRuntimeProvider/ClaudeRuntimeProvider';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <ClaudeRuntimeProvider>
    <App />
  </ClaudeRuntimeProvider>
);
