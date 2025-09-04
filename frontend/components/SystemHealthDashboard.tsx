import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  LinkIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface SystemHealthDashboardProps {
  refreshInterval?: number;
}

interface ServiceStatus {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'error';
  responseTime?: number;
  lastCheck?: Date;
  details?: any;
}

export default function SystemHealthDashboard({ 
  refreshInterval = 15000 
}: SystemHealthDashboardProps) {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'A2A API Server', url: 'http://localhost:8080/api/health', status: 'offline' },
    { name: 'Validator Agent', url: 'http://localhost:8081/health', status: 'offline' },
    { name: 'Frontend App', url: 'http://localhost:3000', status: 'offline' },
    { name: 'Debug Interface', url: 'http://localhost:8080/api/debug/replies', status: 'offline' }
  ]);
  
  const [isChecking, setIsChecking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [systemUptime, setSystemUptime] = useState(0);

  useEffect(() => {
    checkAllServices();
    
    const interval = setInterval(() => {
      checkAllServices();
      setSystemUptime(prev => prev + refreshInterval / 1000);
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const checkAllServices = async () => {
    setIsChecking(true);
    
    const updatedServices = await Promise.all(
      services.map(async (service) => {
        const startTime = Date.now();
        
        try {
          const response = await fetch(service.url, {
            method: 'GET',
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            const details = service.name.includes('Debug') ? 
              await response.json().catch(() => null) : null;
            
            return {
              ...service,
              status: 'online' as const,
              responseTime,
              lastCheck: new Date(),
              details
            };
          } else {
            return {
              ...service,
              status: 'error' as const,
              responseTime,
              lastCheck: new Date()
            };
          }
        } catch (error) {
          return {
            ...service,
            status: 'offline' as const,
            responseTime: Date.now() - startTime,
            lastCheck: new Date()
          };
        }
      })
    );
    
    setServices(updatedServices);
    setLastUpdate(new Date());
    setIsChecking(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return CheckCircleIcon;
      case 'error': return ExclamationTriangleIcon;
      case 'offline': return ClockIcon;
      default: return ClockIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'error': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'offline': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const onlineServices = services.filter(s => s.status === 'online').length;
  const totalServices = services.length;
  const systemHealth = (onlineServices / totalServices) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ChartBarIcon className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">System Health</h3>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right text-sm">
            <div className="text-gray-400">Uptime</div>
            <div className="text-blue-400 font-mono">
              {Math.floor(systemUptime / 60)}m {Math.floor(systemUptime % 60)}s
            </div>
          </div>
          
          <button
            onClick={checkAllServices}
            disabled={isChecking}
            className="p-2 bg-blue-500/20 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 text-blue-400 ${isChecking ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overall Health Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">System Health Score</span>
          <span className={`text-2xl font-bold ${
            systemHealth === 100 ? 'text-green-400' :
            systemHealth >= 75 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {systemHealth.toFixed(0)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3">
          <motion.div
            className={`h-3 rounded-full ${
              systemHealth === 100 ? 'bg-gradient-to-r from-green-500 to-green-400' :
              systemHealth >= 75 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
              'bg-gradient-to-r from-red-500 to-red-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${systemHealth}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        
        <div className="mt-2 text-xs text-gray-400">
          {onlineServices}/{totalServices} services online
        </div>
      </div>

      {/* Service Status List */}
      <div className="space-y-3">
        {services.map((service, index) => {
          const StatusIcon = getStatusIcon(service.status);
          
          return (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${getStatusColor(service.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <StatusIcon className="h-5 w-5" />
                  <div>
                    <div className="text-white font-medium">{service.name}</div>
                    <div className="text-gray-400 text-sm">{service.url}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-medium capitalize ${getStatusColor(service.status).split(' ')[0]}`}>
                    {service.status}
                  </div>
                  {service.responseTime && (
                    <div className="text-gray-400 text-sm">
                      {service.responseTime}ms
                    </div>
                  )}
                </div>
              </div>
              
              {/* Additional Details */}
              {service.details && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="text-xs text-gray-400">
                    Sessions: {service.details.total_sessions || 0} | 
                    AI Available: {service.details.services?.ai ? '✅' : '❌'}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Last Update Info */}
      <div className="mt-6 pt-4 border-t border-gray-700 flex items-center justify-between text-sm">
        <div className="text-gray-400">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
        
        <div className={`flex items-center space-x-2 ${
          systemHealth === 100 ? 'text-green-400' : 'text-yellow-400'
        }`}>
          <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
          <span>
            {systemHealth === 100 ? 'All Systems Operational' : 'Some Issues Detected'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => window.open('http://localhost:8080/docs', '_blank')}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          API Docs
        </button>
        <button
          onClick={() => window.open('http://localhost:8081/docs', '_blank')}
          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
        >
          Validator Docs
        </button>
        <button
          onClick={() => window.open('https://sepolia.basescan.org', '_blank')}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
        >
          BaseScan
        </button>
      </div>
    </motion.div>
  );
}
