import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';

interface Issue {
  type: string;
  message: string;
  line?: number;
  severity: string;
}

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language: string;
  issues?: Issue[];
}

export default function CodeEditor({ code, onChange, language, issues = [] }: CodeEditorProps) {
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  useEffect(() => {
    const lines = code.split('\n');
    setLineNumbers(lines.map((_, index) => index + 1));
  }, [code]);

  const getIssueForLine = (lineNum: number) => {
    return issues.find(issue => issue.line === lineNum);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return XCircleIcon;
      case 'high': return ExclamationTriangleIcon;
      case 'medium': return ShieldExclamationIcon;
      case 'low': return InformationCircleIcon;
      default: return InformationCircleIcon;
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      {/* Code Editor Container */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
        
        {/* Editor Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-gray-400 text-sm font-mono">
              {language === 'python' && '🐍'} 
              {language === 'javascript' && '⚡'} 
              {language === 'typescript' && '🔷'} 
              {language === 'solidity' && '💎'} 
              {language}
            </span>
          </div>
          
          {issues.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">{issues.length} issues found</span>
              <div className="flex space-x-1">
                {['critical', 'high', 'medium', 'low'].map(severity => {
                  const count = issues.filter(i => i.severity === severity).length;
                  if (count === 0) return null;
                  
                  return (
                    <div 
                      key={severity}
                      className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(severity)}`}
                    >
                      {count}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Editor Body */}
        <div className="relative">
          <div className="flex">
            
            {/* Line Numbers */}
            <div className="bg-gray-850 px-3 py-4 border-r border-gray-700 select-none">
              {lineNumbers.map((lineNum) => {
                const issue = getIssueForLine(lineNum);
                const IconComponent = issue ? getSeverityIcon(issue.severity) : null;
                
                return (
                  <div
                    key={lineNum}
                    className={`
                      flex items-center justify-between h-6 text-sm font-mono
                      ${issue ? getSeverityColor(issue.severity).split(' ')[0] : 'text-gray-500'}
                      ${hoveredLine === lineNum ? 'bg-gray-700/50' : ''}
                    `}
                    onMouseEnter={() => setHoveredLine(lineNum)}
                    onMouseLeave={() => setHoveredLine(null)}
                  >
                    <span className="w-8 text-right">{lineNum}</span>
                    {IconComponent && (
                      <IconComponent className="h-4 w-4 ml-2" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Code Input */}
            <div className="flex-1 relative">
              <textarea
                value={code}
                onChange={handleTextareaChange}
                className="
                  w-full h-96 p-4 bg-transparent text-white font-mono text-sm
                  resize-vertical outline-none border-none
                  leading-6 overflow-auto
                "
                placeholder={`Enter your ${language} code here... (supports large files up to 100KB)`}
                spellCheck={false}
                maxLength={100000}
                style={{
                  lineHeight: '1.5rem', // Match line number height
                  tabSize: 2,
                  minHeight: '24rem', // Allow expansion
                  maxHeight: '48rem'
                }}
              />

              {/* Issue Tooltips */}
              {hoveredLine && getIssueForLine(hoveredLine) && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="absolute left-full top-0 ml-4 z-10"
                  style={{ 
                    top: `${(hoveredLine - 1) * 24 + 16}px` // Adjust based on line height
                  }}
                >
                  <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl max-w-sm">
                    <div className="flex items-start space-x-2">
                      {(() => {
                        const issue = getIssueForLine(hoveredLine);
                        if (!issue) return null;
                        const IconComponent = getSeverityIcon(issue.severity);
                        return <IconComponent className={`h-5 w-5 ${getSeverityColor(issue.severity).split(' ')[0]} flex-shrink-0 mt-0.5`} />;
                      })()}
                      <div>
                        <div className={`text-sm font-medium ${getSeverityColor(getIssueForLine(hoveredLine)?.severity || '').split(' ')[0]}`}>
                          {getIssueForLine(hoveredLine)?.severity?.toUpperCase()} - Line {hoveredLine}
                        </div>
                        <div className="text-white text-sm mt-1">
                          {getIssueForLine(hoveredLine)?.message}
                        </div>
                        <div className="text-gray-400 text-xs mt-2">
                          Type: {getIssueForLine(hoveredLine)?.type}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Editor Footer */}
        <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Lines: {lineNumbers.length}</span>
            <span>Chars: {code.length}</span>
            <span>Language: {language}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>UTF-8</span>
            <span>LF</span>
            <span>Spaces: 2</span>
          </div>
        </div>
      </div>

      {/* Issue Summary Panel */}
      {issues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-gray-800/50 rounded-xl border border-gray-700 p-4"
        >
          <h4 className="text-white font-medium mb-3 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
            Issues Summary
          </h4>
          
          <div className="space-y-2">
            {issues.slice(0, 3).map((issue, index) => {
              const IconComponent = getSeverityIcon(issue.severity);
              return (
                <div key={index} className="flex items-start space-x-3 p-2 bg-gray-700/30 rounded-lg">
                  <IconComponent className={`h-4 w-4 ${getSeverityColor(issue.severity).split(' ')[0]} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                      {issue.line && (
                        <span className="text-xs text-gray-400">Line {issue.line}</span>
                      )}
                    </div>
                    <p className="text-white text-sm mt-1">{issue.message}</p>
                  </div>
                </div>
              );
            })}
            
            {issues.length > 3 && (
              <div className="text-center py-2">
                <span className="text-gray-400 text-sm">
                  +{issues.length - 3} more issues
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
