/**
 * Cron Job Persistent Storage
 * Manages persistent storage of cron job status and steps in MongoDB
 */

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import CronJobStatus from '/models/cronJobStatus';

// Collections for persistent storage
export { CronJobStatus };
export const CronJobSteps = new Mongo.Collection('cronJobSteps');
export const CronJobQueue = new Mongo.Collection('cronJobQueue');
export const CronJobErrors = new Mongo.Collection('cronJobErrors');

// Allow/Deny rules
// These collections are server-only and should not be modified by clients
// Allow server-side operations (when userId is undefined) but deny all client operations
if (Meteor.isServer) {
  // Helper function to check if operation is server-only
  const isServerOperation = (userId) => !userId;

  CronJobStatus.allow({
    insert: isServerOperation,
    update: isServerOperation,
    remove: isServerOperation,
  });

  CronJobSteps.allow({
    insert: isServerOperation,
    update: isServerOperation,
    remove: isServerOperation,
  });

  CronJobQueue.allow({
    insert: isServerOperation,
    update: isServerOperation,
    remove: isServerOperation,
  });

  CronJobErrors.allow({
    insert: isServerOperation,
    update: isServerOperation,
    remove: isServerOperation,
  });
}

// Indexes for performance
if (Meteor.isServer) {
  Meteor.startup(async () => {
    // Index for job status queries
    await CronJobStatus._collection.createIndexAsync({ jobId: 1 });
    await CronJobStatus._collection.createIndexAsync({ status: 1 });
    await CronJobStatus._collection.createIndexAsync({ createdAt: 1 });
    await CronJobStatus._collection.createIndexAsync({ updatedAt: 1 });

    // Index for job steps queries
    await CronJobSteps._collection.createIndexAsync({ jobId: 1 });
    await CronJobSteps._collection.createIndexAsync({ stepIndex: 1 });
    await CronJobSteps._collection.createIndexAsync({ status: 1 });

    // Index for job queue queries
    await CronJobQueue._collection.createIndexAsync({ priority: 1, createdAt: 1 });
    await CronJobQueue._collection.createIndexAsync({ status: 1 });
    await CronJobQueue._collection.createIndexAsync({ jobType: 1 });

    // Index for job errors queries
    await CronJobErrors._collection.createIndexAsync({ jobId: 1, createdAt: -1 });
    await CronJobErrors._collection.createIndexAsync({ stepId: 1 });
    await CronJobErrors._collection.createIndexAsync({ severity: 1 });
    await CronJobErrors._collection.createIndexAsync({ createdAt: -1 });
  });
}

class CronJobStorage {
  constructor() {
    this.maxConcurrentJobs = this.getMaxConcurrentJobs();
    this.cpuThreshold = 80; // CPU usage threshold percentage
    this.memoryThreshold = 95; // Memory usage threshold percentage (increased for better job processing)
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
  async saveJobStatus(jobId, jobData) {
    const now = new Date();
    const existingJob = await CronJobStatus.findOneAsync({ jobId });

    if (existingJob) {
      await CronJobStatus.updateAsync(
        { jobId },
        {
          $set: {
            ...jobData,
            updatedAt: now
          }
        }
      );
    } else {
      await CronJobStatus.insertAsync({
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
  async getJobStatus(jobId) {
    return await CronJobStatus.findOneAsync({ jobId });
  }

  /**
   * Get all incomplete jobs
   */
  async getIncompleteJobs() {
    return await CronJobStatus.find({
      status: { $in: ['pending', 'running', 'paused'] }
    }).fetchAsync();
  }

  /**
   * Save job step status
   */
  async saveJobStep(jobId, stepIndex, stepData) {
    const now = new Date();
    const existingStep = await CronJobSteps.findOneAsync({ jobId, stepIndex });

    if (existingStep) {
      await CronJobSteps.updateAsync(
        { jobId, stepIndex },
        {
          $set: {
            ...stepData,
            updatedAt: now
          }
        }
      );
    } else {
      await CronJobSteps.insertAsync({
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
  async getJobSteps(jobId) {
    return await CronJobSteps.find(
      { jobId },
      { sort: { stepIndex: 1 } }
    ).fetchAsync();
  }

  /**
   * Get incomplete steps for a job
   */
  async getIncompleteSteps(jobId) {
    return await CronJobSteps.find({
      jobId,
      status: { $in: ['pending', 'running'] }
    }, { sort: { stepIndex: 1 } }).fetchAsync();
  }

  /**
   * Save job error to persistent storage
   */
  async saveJobError(jobId, errorData) {
    const now = new Date();
    const { stepId, stepIndex, error, severity = 'error', context = {} } = errorData;

    await CronJobErrors.insertAsync({
      jobId,
      stepId,
      stepIndex,
      errorMessage: typeof error === 'string' ? error : error.message || 'Unknown error',
      errorStack: error.stack || null,
      severity,
      context,
      createdAt: now
    });
  }

  /**
   * Get job errors from persistent storage
   */
  async getJobErrors(jobId, options = {}) {
    const { limit = 100, severity = null } = options;

    const query = { jobId };
    if (severity) {
      query.severity = severity;
    }

    return await CronJobErrors.find(query, {
      sort: { createdAt: -1 },
      limit
    }).fetchAsync();
  }

  /**
   * Get all recent errors across all jobs
   */
  async getAllRecentErrors(limit = 50) {
    return await CronJobErrors.find({}, {
      sort: { createdAt: -1 },
      limit
    }).fetchAsync();
  }

  /**
   * Clear errors for a specific job
   */
  async clearJobErrors(jobId) {
    return await CronJobErrors.removeAsync({ jobId });
  }

  /**
   * Add job to queue
   */
  async addToQueue(jobId, jobType, priority = 5, jobData = {}) {
    const now = new Date();

    // Check if job already exists in queue
    const existingJob = await CronJobQueue.findOneAsync({ jobId });
    if (existingJob) {
      return existingJob._id;
    }

    return await CronJobQueue.insertAsync({
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
  async getNextJob() {
    return await CronJobQueue.findOneAsync({
      status: 'pending'
    }, {
      sort: { priority: 1, createdAt: 1 }
    });
  }

  /**
   * Update job queue status
   */
  async updateQueueStatus(jobId, status, additionalData = {}) {
    const now = new Date();
    await CronJobQueue.updateAsync(
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
  async removeFromQueue(jobId) {
    await CronJobQueue.removeAsync({ jobId });
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
  async canStartNewJob() {
    const resources = this.getSystemResources();
    const runningJobs = await CronJobQueue.find({ status: 'running' }).countAsync();

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
  async getQueueStats() {
    const total = await CronJobQueue.find().countAsync();
    const pending = await CronJobQueue.find({ status: 'pending' }).countAsync();
    const running = await CronJobQueue.find({ status: 'running' }).countAsync();
    const completed = await CronJobQueue.find({ status: 'completed' }).countAsync();
    const failed = await CronJobQueue.find({ status: 'failed' }).countAsync();

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
  async cleanupOldJobs(daysOld = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Remove old completed jobs from queue
    const removedQueue = await CronJobQueue.removeAsync({
      status: 'completed',
      updatedAt: { $lt: cutoffDate }
    });

    // Remove old job statuses
    const removedStatus = await CronJobStatus.removeAsync({
      status: 'completed',
      updatedAt: { $lt: cutoffDate }
    });

    // Remove old job steps
    const removedSteps = await CronJobSteps.removeAsync({
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
  async resumeIncompleteJobs() {
    const incompleteJobs = await this.getIncompleteJobs();
    const resumedJobs = [];

    for (const job of incompleteJobs) {
      // Reset running jobs to pending
      if (job.status === 'running') {
        await this.saveJobStatus(job.jobId, {
          ...job,
          status: 'pending',
          error: 'Job was interrupted during startup'
        });
        resumedJobs.push(job.jobId);
      }

      // Add to queue if not already there
      const queueJob = await CronJobQueue.findOneAsync({ jobId: job.jobId });
      if (!queueJob) {
        await this.addToQueue(job.jobId, job.jobType || 'unknown', job.priority || 5, job);
      }
    }

    return resumedJobs;
  }

  /**
   * Get job progress percentage
   */
  async getJobProgress(jobId) {
    const steps = await this.getJobSteps(jobId);
    if (steps.length === 0) return 0;

    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  }

  /**
   * Get detailed job information
   */
  async getJobDetails(jobId) {
    const jobStatus = await this.getJobStatus(jobId);
    const jobSteps = await this.getJobSteps(jobId);
    const progress = await this.getJobProgress(jobId);

    return {
      ...jobStatus,
      steps: jobSteps,
      progress,
      totalSteps: jobSteps.length,
      completedSteps: jobSteps.filter(step => step.status === 'completed').length
    };
  }

  /**
   * Clear all jobs from storage
   */
  async clearAllJobs() {
    try {
      // Clear all collections
      await CronJobStatus.removeAsync({});
      await CronJobSteps.removeAsync({});
      await CronJobQueue.removeAsync({});
      await CronJobErrors.removeAsync({});

      console.log('All cron job data cleared from storage');
      return { success: true, message: 'All cron job data cleared' };
    } catch (error) {
      console.error('Error clearing cron job storage:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const cronJobStorage = new CronJobStorage();

// Cleanup old jobs on startup
Meteor.startup(async () => {
  // Resume incomplete jobs
  const resumedJobs = await cronJobStorage.resumeIncompleteJobs();
  if (resumedJobs.length > 0) {
    // Resumed incomplete cron jobs
  }

  // Cleanup old jobs
  const cleanup = await cronJobStorage.cleanupOldJobs();
  if (cleanup.removedQueue > 0 || cleanup.removedStatus > 0 || cleanup.removedSteps > 0) {
    // Cleaned up old cron jobs
  }
});
