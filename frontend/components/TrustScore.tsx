import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  TrophyIcon,
  StarIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface TrustScoreProps {
  reviewScore?: number;
  validationScore?: number;
}

export default function TrustScore({ reviewScore, validationScore }: TrustScoreProps) {
  // Calculate overall trust score based on available scores
  const calculateTrustScore = () => {
    if (reviewScore && validationScore) {
      return Math.round((reviewScore * 0.6 + validationScore * 0.4));
    } else if (reviewScore) {
      return reviewScore;
    }
    return 0;
  };

  const trustScore = calculateTrustScore();

  const getTrustLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' };
    if (score >= 80) return { level: 'Very Good', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' };
    if (score >= 70) return { level: 'Good', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
    if (score >= 60) return { level: 'Fair', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
    return { level: 'Needs Improvement', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
  };

  const getStarRating = (score: number) => {
    return Math.round((score / 100) * 5);
  };

  const getTrustGradient = (score: number) => {
    if (score >= 90) return 'from-green-500 to-green-400';
    if (score >= 80) return 'from-blue-500 to-blue-400';
    if (score >= 70) return 'from-yellow-500 to-yellow-400';
    if (score >= 60) return 'from-orange-500 to-orange-400';
    return 'from-red-500 to-red-400';
  };

  const trustInfo = getTrustLevel(trustScore);
  const starRating = getStarRating(trustScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <TrophyIcon className="h-6 w-6 text-yellow-400" />
          <h3 className="text-xl font-semibold text-white">Trust Score</h3>
        </div>
        <div className="flex items-center space-x-1">
          <LinkIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-400 text-xs">ERC-8004</span>
        </div>
      </div>

      {/* Main Trust Score Display */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative inline-block"
        >
          {/* Circular Progress */}
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="rgb(55, 65, 81)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <motion.circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="url(#trustGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - trustScore / 100) }}
                transition={{ duration: 1, delay: 0.5 }}
              />
              <defs>
                <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={`stop-color-${getTrustGradient(trustScore).split('-')[1]}-500`} />
                  <stop offset="100%" className={`stop-color-${getTrustGradient(trustScore).split('-')[3]}-400`} />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Score display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className={`text-3xl font-bold ${trustInfo.color}`}
                >
                  {trustScore}
                </motion.div>
                <div className="text-gray-400 text-xs">/ 100</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust Level */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mt-4"
        >
          <div className={`inline-block px-4 py-2 rounded-full border ${trustInfo.bg} ${trustInfo.border}`}>
            <span className={`font-semibold ${trustInfo.color}`}>{trustInfo.level}</span>
          </div>
        </motion.div>

        {/* Star Rating */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="flex items-center justify-center mt-3 space-x-1"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.div
              key={star}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 1.2 + star * 0.1 }}
            >
              {star <= starRating ? (
                <StarIconSolid className="h-5 w-5 text-yellow-400" />
              ) : (
                <StarIcon className="h-5 w-5 text-gray-500" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Component Scores */}
      {(reviewScore || validationScore) && (
        <div className="space-y-4">
          <h4 className="text-white font-medium mb-3">Score Breakdown</h4>
          
          {reviewScore && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <ChartBarIcon className="h-5 w-5 text-blue-400" />
                <span className="text-white">Code Review Quality</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${reviewScore}%` }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className={`h-full bg-gradient-to-r ${getTrustGradient(reviewScore)} rounded-full`}
                  />
                </div>
                <span className="text-blue-400 font-bold w-10 text-right">{reviewScore}</span>
              </div>
            </motion.div>
          )}

          {validationScore && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
              className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <CheckBadgeIcon className="h-5 w-5 text-purple-400" />
                <span className="text-white">Validation Score</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${validationScore}%` }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    className={`h-full bg-gradient-to-r ${getTrustGradient(validationScore)} rounded-full`}
                  />
                </div>
                <span className="text-purple-400 font-bold w-10 text-right">{validationScore}</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Trust Factors */}
      <div className="mt-6 p-4 bg-gray-700/20 rounded-xl">
        <h5 className="text-white font-medium mb-3 flex items-center">
          <ShieldCheckIcon className="h-4 w-4 text-green-400 mr-2" />
          Trust Factors
        </h5>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-300">Blockchain Verified</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-300">AI Analysis</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-gray-300">Independent Validation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-gray-300">Reputation Based</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700 text-center">
        <p className="text-gray-400 text-xs">
          Trust score calculated using ERC-8004 trustless agent interactions
        </p>
      </div>
    </motion.div>
  );
}
