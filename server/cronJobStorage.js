/**
 * Cron Job Persistent Storage
 * Manages persistent storage of cron job status and steps in MongoDB
 */

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

// Collections for persistent storage
export const CronJobStatus = new Mongo.Collection('cronJobStatus');
export const CronJobSteps = new Mongo.Collection('cronJobSteps');
export const CronJobQueue = new Mongo.Collection('cronJobQueue');

// Indexes for performance
if (Meteor.isServer) {
  Meteor.startup(() => {
    // Index for job status queries
    CronJobStatus._collection.createIndex({ jobId: 1 });
    CronJobStatus._collection.createIndex({ status: 1 });
    CronJobStatus._collection.createIndex({ createdAt: 1 });
    CronJobStatus._collection.createIndex({ updatedAt: 1 });
    
    // Index for job steps queries
    CronJobSteps._collection.createIndex({ jobId: 1 });
    CronJobSteps._collection.createIndex({ stepIndex: 1 });
    CronJobSteps._collection.createIndex({ status: 1 });
    
    // Index for job queue queries
    CronJobQueue._collection.createIndex({ priority: 1, createdAt: 1 });
    CronJobQueue._collection.createIndex({ status: 1 });
    CronJobQueue._collection.createIndex({ jobType: 1 });
  });
}

class CronJobStorage {
  constructor() {
    this.maxConcurrentJobs = this.getMaxConcurrentJobs();
    this.cpuThreshold = 80; // CPU usage threshold percentage
    this.memoryThreshold = 90; // Memory usage threshold percentage
  }

  /**
   * Get maximum concurrent jobs based on system resources
   */
  getMaxConcurrentJobs() {
    // Default to 3 concurrent jobs, but can be configured via environment
    const envLimit = process.env.MAX_CONCURRENT_CRON_JOBS;
    if (envLimit) {
      return parseInt(envLimit, 10);
    }
    
    // Auto-detect based on CPU cores
    const os = require('os');
    const cpuCores = os.cpus().length;
    return Math.max(1, Math.min(5, Math.floor(cpuCores / 2)));
  }

  /**
   * Save job status to persistent storage
   */
  saveJobStatus(jobId, jobData) {
    const now = new Date();
    const existingJob = CronJobStatus.findOne({ jobId });
    
    if (existingJob) {
      CronJobStatus.update(
        { jobId },
        {
          $set: {
            ...jobData,
            updatedAt: now
          }
        }
      );
    } else {
      CronJobStatus.insert({
        jobId,
        ...jobData,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  /**
   * Get job status from persistent storage
   */
  getJobStatus(jobId) {
    return CronJobStatus.findOne({ jobId });
  }

  /**
   * Get all incomplete jobs
   */
  getIncompleteJobs() {
    return CronJobStatus.find({
      status: { $in: ['pending', 'running', 'paused'] }
    }).fetch();
  }

  /**
   * Save job step status
   */
  saveJobStep(jobId, stepIndex, stepData) {
    const now = new Date();
    const existingStep = CronJobSteps.findOne({ jobId, stepIndex });
    
    if (existingStep) {
      CronJobSteps.update(
        { jobId, stepIndex },
        {
          $set: {
            ...stepData,
            updatedAt: now
          }
        }
      );
    } else {
      CronJobSteps.insert({
        jobId,
        stepIndex,
        ...stepData,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  /**
   * Get job steps
   */
  getJobSteps(jobId) {
    return CronJobSteps.find(
      { jobId },
      { sort: { stepIndex: 1 } }
    ).fetch();
  }

  /**
   * Get incomplete steps for a job
   */
  getIncompleteSteps(jobId) {
    return CronJobSteps.find({
      jobId,
      status: { $in: ['pending', 'running'] }
    }, { sort: { stepIndex: 1 } }).fetch();
  }

  /**
   * Add job to queue
   */
  addToQueue(jobId, jobType, priority = 5, jobData = {}) {
    const now = new Date();
    
    // Check if job already exists in queue
    const existingJob = CronJobQueue.findOne({ jobId });
    if (existingJob) {
      return existingJob._id;
    }
    
    return CronJobQueue.insert({
      jobId,
      jobType,
      priority,
      status: 'pending',
      jobData,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Get next job from queue
   */
  getNextJob() {
    return CronJobQueue.findOne({
      status: 'pending'
    }, {
      sort: { priority: 1, createdAt: 1 }
    });
  }

  /**
   * Update job queue status
   */
  updateQueueStatus(jobId, status, additionalData = {}) {
    const now = new Date();
    CronJobQueue.update(
      { jobId },
      {
        $set: {
          status,
          ...additionalData,
          updatedAt: now
        }
      }
    );
  }

  /**
   * Remove job from queue
   */
  removeFromQueue(jobId) {
    CronJobQueue.remove({ jobId });
  }

  /**
   * Get system resource usage
   */
  getSystemResources() {
    const os = require('os');
    
    // Get CPU usage (simplified)
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const cpuUsage = 100 - Math.round(100 * totalIdle / totalTick);
    
    // Get memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = Math.round(100 * (totalMem - freeMem) / totalMem);
    
    return {
      cpuUsage,
      memoryUsage,
      totalMem,
      freeMem,
      cpuCores: cpus.length
    };
  }

  /**
   * Check if system can handle more jobs
   */
  canStartNewJob() {
    const resources = this.getSystemResources();
    const runningJobs = CronJobQueue.find({ status: 'running' }).count();
    
    // Check CPU and memory thresholds
    if (resources.cpuUsage > this.cpuThreshold) {
      return { canStart: false, reason: 'CPU usage too high' };
    }
    
    if (resources.memoryUsage > this.memoryThreshold) {
      return { canStart: false, reason: 'Memory usage too high' };
    }
    
    // Check concurrent job limit
    if (runningJobs >= this.maxConcurrentJobs) {
      return { canStart: false, reason: 'Maximum concurrent jobs reached' };
    }
    
    return { canStart: true, reason: 'System can handle new job' };
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    const total = CronJobQueue.find().count();
    const pending = CronJobQueue.find({ status: 'pending' }).count();
    const running = CronJobQueue.find({ status: 'running' }).count();
    const completed = CronJobQueue.find({ status: 'completed' }).count();
    const failed = CronJobQueue.find({ status: 'failed' }).count();
    
    return {
      total,
      pending,
      running,
      completed,
      failed,
      maxConcurrent: this.maxConcurrentJobs
    };
  }

  /**
   * Clean up old completed jobs
   */
  cleanupOldJobs(daysOld = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    // Remove old completed jobs from queue
    const removedQueue = CronJobQueue.remove({
      status: 'completed',
      updatedAt: { $lt: cutoffDate }
    });
    
    // Remove old job statuses
    const removedStatus = CronJobStatus.remove({
      status: 'completed',
      updatedAt: { $lt: cutoffDate }
    });
    
    // Remove old job steps
    const removedSteps = CronJobSteps.remove({
      status: 'completed',
      updatedAt: { $lt: cutoffDate }
    });
    
    return {
      removedQueue,
      removedStatus,
      removedSteps
    };
  }

  /**
   * Resume incomplete jobs on startup
   */
  resumeIncompleteJobs() {
    const incompleteJobs = this.getIncompleteJobs();
    const resumedJobs = [];
    
    incompleteJobs.forEach(job => {
      // Reset running jobs to pending
      if (job.status === 'running') {
        this.saveJobStatus(job.jobId, {
          ...job,
          status: 'pending',
          error: 'Job was interrupted during startup'
        });
        resumedJobs.push(job.jobId);
      }
      
      // Add to queue if not already there
      const queueJob = CronJobQueue.findOne({ jobId: job.jobId });
      if (!queueJob) {
        this.addToQueue(job.jobId, job.jobType || 'unknown', job.priority || 5, job);
      }
    });
    
    return resumedJobs;
  }

  /**
   * Get job progress percentage
   */
  getJobProgress(jobId) {
    const steps = this.getJobSteps(jobId);
    if (steps.length === 0) return 0;
    
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  }

  /**
   * Get detailed job information
   */
  getJobDetails(jobId) {
    const jobStatus = this.getJobStatus(jobId);
    const jobSteps = this.getJobSteps(jobId);
    const progress = this.getJobProgress(jobId);
    
    return {
      ...jobStatus,
      steps: jobSteps,
      progress,
      totalSteps: jobSteps.length,
      completedSteps: jobSteps.filter(step => step.status === 'completed').length
    };
  }
}

// Export singleton instance
export const cronJobStorage = new CronJobStorage();

// Cleanup old jobs on startup
Meteor.startup(() => {
  // Resume incomplete jobs
  const resumedJobs = cronJobStorage.resumeIncompleteJobs();
  if (resumedJobs.length > 0) {
    console.log(`Resumed ${resumedJobs.length} incomplete cron jobs:`, resumedJobs);
  }
  
  // Cleanup old jobs
  const cleanup = cronJobStorage.cleanupOldJobs();
  if (cleanup.removedQueue > 0 || cleanup.removedStatus > 0 || cleanup.removedSteps > 0) {
    console.log('Cleaned up old cron jobs:', cleanup);
  }
});
