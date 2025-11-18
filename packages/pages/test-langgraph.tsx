import React, { useState } from 'react';
import { useLangGraphAssistant } from '../frontend/hooks/useLangGraphAssistant';

const TestLangGraphPage: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const {
    messages,
    isLoading,
    error,
    threadId,
    toolsInProgress,
    thinkingMessage,
    currentStep,
    totalSteps,
    toolStatuses,
    sendMessage,
    stopGeneration,
    clearConversation,
    retryLastMessage
  } = useLangGraphAssistant();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    await sendMessage(inputMessage.trim());
    setInputMessage('');
  };

  const renderMessageContent = (content: any[]) => {
    return content.map((part, index) => {
      switch (part.type) {
        case 'text':
          return (
            <div key={index} className="text-gray-800 whitespace-pre-wrap">
              {part.text}
            </div>
          );
        case 'tool-call':
          return (
            <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-2">
              <div className="font-semibold text-blue-800">
                🔧 Tool: {part.toolName}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                Args: {part.argsText || JSON.stringify(part.args)}
              </div>
              {part.result && (
                <div className="text-sm text-green-600 mt-2">
                  <div className="font-semibold">Result:</div>
                  <div className="bg-green-50 p-2 rounded mt-1">
                    {typeof part.result === 'string' 
                      ? part.result.substring(0, 500) + (part.result.length > 500 ? '...' : '')
                      : JSON.stringify(part.result, null, 2).substring(0, 500)
                    }
                  </div>
                </div>
              )}
              {toolsInProgress.includes(part.toolCallId) && (
                <div className="text-yellow-600 text-sm mt-2">
                  ⏳ Executing...
                </div>
              )}
            </div>
          );
        default:
          return (
            <div key={index} className="text-gray-500 text-sm">
              {JSON.stringify(part)}
            </div>
          );
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              LangGraph Assistant Test
            </h1>
            <div className="text-sm text-gray-500">
              Thread ID: {threadId.substring(0, 8)}...
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
              <button
                onClick={retryLastMessage}
                className="ml-4 text-red-800 hover:text-red-900 underline"
              >
                Retry
              </button>
            </div>
          )}

          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-gray-500 text-center py-8">
                Start a conversation with the LangGraph-powered assistant!
                <br />
                <span className="text-sm">Try asking about current events, document editing, or complex tasks.</span>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-100 border border-blue-200 ml-8'
                    : 'bg-gray-100 border border-gray-200 mr-8'
                }`}
              >
                <div className="font-semibold text-sm mb-2">
                  {message.role === 'user' ? '👤 You' : '🤖 Athena (LangGraph)'}
                </div>
                {renderMessageContent(message.content)}
              </div>
            ))}
            
            {isLoading && (
              <div className="bg-gray-100 border border-gray-200 mr-8 p-4 rounded-lg">
                <div className="font-semibold text-sm mb-2">🤖 Athena (LangGraph)</div>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    {thinkingMessage || 'Thinking...'}
                  </div>
                  
                  {/* Step progression */}
                  {currentStep && totalSteps && (
                    <div className="flex items-center text-sm text-blue-600">
                      <span>Step {currentStep} of {totalSteps}</span>
                      <div className="ml-3 flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Tool statuses */}
                  {Object.entries(toolStatuses).map(([tool, status]) => (
                    <div key={tool} className="text-sm text-green-600 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="font-medium">{tool}:</span>
                      <span className="ml-1">{status}</span>
                    </div>
                  ))}
                  
                  {/* Tools in progress count */}
                  {toolsInProgress.length > 0 && (
                    <div className="text-sm text-yellow-600">
                      🔧 Running {toolsInProgress.length} tool{toolsInProgress.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything... I have web search, memory, and document editing capabilities!"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
            {isLoading && (
              <button
                type="button"
                onClick={stopGeneration}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Stop
              </button>
            )}
          </form>

          <div className="flex gap-2 mt-4">
            <button
              onClick={clearConversation}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              disabled={isLoading}
            >
              Clear
            </button>
            
            <div className="flex-1"></div>
            
            <div className="text-sm text-gray-500 py-2">
              LangGraph Workflow: ✅ Web Search | ✅ Memory | ✅ Document Editing
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Test Examples:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• "What's the latest news about AI?" (Web Search)</li>
              <li>• "Remember that I prefer Python for data analysis" (Memory Storage)</li>
              <li>• "What do you remember about my preferences?" (Memory Search)</li>
              <li>• "Rewrite this text to be more formal: Hey there!" (Document Editing)</li>
              <li>• "Search for information about quantum computing and then summarize it"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestLangGraphPage;
