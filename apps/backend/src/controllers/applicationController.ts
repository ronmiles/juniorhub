import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Application from '../models/Application';
import Project from '../models/Project';
import User from '../models/User';
import { createNotification } from './notificationController';
import { sendNotificationToUser } from '../utils/socket';

/**
 * Get all applications (admin only)
 * @route GET /api/applications
 * @access Admin
 */
export const getApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, project, applicant, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build query
    const query: any = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by project if provided
    if (project) {
      query.project = project;
    }
    
    // Filter by applicant if provided
    if (applicant) {
      query.applicant = applicant;
    }
    
    // Get total count for pagination
    const total = await Application.countDocuments(query);
    
    // Get applications with pagination
    const applications = await Application.find(query)
      .populate('project', 'title description')
      .populate('applicant', 'name email profilePicture')
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      totalPages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
      data: applications,
    });
  } catch (error) {
    console.error('Error in getApplications:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Get application by ID
 * @route GET /api/applications/:id
 * @access Private
 */
export const getApplicationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const applicationId = req.params.id;
    
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid application ID',
      });
      return;
    }
    
    const application = await Application.findById(applicationId)
      .populate('project', 'title description owner')
      .populate('applicant', 'name email profilePicture');
    
    if (!application) {
      res.status(404).json({
        success: false,
        error: 'Application not found',
      });
      return;
    }
    
    // Check if user is authorized to view this application
    // Users can view their own applications or applications for their projects
    const userId = req.user.userId;
    const projectOwner = (application.project as any).owner.toString();
    const applicantId = (application.applicant as any)._id.toString();
    
    if (userId !== applicantId && userId !== projectOwner && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to view this application',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Error in getApplicationById:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Create application
 * @route POST /api/projects/:projectId/applications
 * @access Private (Junior role only)
 */
export const createApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }
    
    const projectId = req.params.id;
    const userId = req.user.userId;
    
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
      return;
    }
    
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }
    
    // Check if project is accepting applications
    if (!project.isAcceptingApplications) {
      res.status(400).json({
        success: false,
        error: 'Project is not accepting applications',
      });
      return;
    }
    
    // Check if user has already applied
    const existingApplication = await Application.findOne({
      project: projectId,
      applicant: userId,
    });
    
    if (existingApplication) {
      res.status(400).json({
        success: false,
        error: 'You have already applied to this project',
      });
      return;
    }
    
    // Create application
    const { coverLetter } = req.body;
    
    const application = new Application({
      project: projectId,
      applicant: userId,
      coverLetter,
      status: 'pending',
    });
    
    await application.save();
    
    // Add application to user's applications
    await User.findByIdAndUpdate(userId, {
      $push: { applications: application._id },
    });
    
    // Add application to project's applications
    await Project.findByIdAndUpdate(projectId, {
      $push: { applications: application._id },
    });
    
    // Get project owner ID
    const projectWithOwner = await Project.findById(projectId);
    const projectOwnerUser = await User.findById(projectWithOwner.company);
    
    if (projectWithOwner && projectOwnerUser) {
      const ownerId = projectOwnerUser._id.toString();
      const notification = await createNotification(
        ownerId,
        `New application received for your project "${projectWithOwner.title}"`,
        'info',
        {
          model: 'Application',
          id: application._id.toString(),
        }
      );
      
      // Send real-time notification
      sendNotificationToUser(ownerId, notification);
    }
    
    res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    console.error('Error in createApplication:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Update application status
 * @route PUT /api/applications/:id
 * @access Private (Project owner or Admin)
 */
export const updateApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }
    
    const applicationId = req.params.id;
    const userId = req.user.userId;
    
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid application ID',
      });
      return;
    }
    
    // Get application
    const application = await Application.findById(applicationId)
      .populate('project', 'owner');
    
    if (!application) {
      res.status(404).json({
        success: false,
        error: 'Application not found',
      });
      return;
    }
    
    // Check if user is authorized to update this application
    const projectOwner = (application.project as any).owner.toString();
    
    if (userId !== projectOwner && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this application',
      });
      return;
    }
    
    // Update application
    const { status, feedback } = req.body;
    const previousStatus = application.status;
    
    application.status = status;
    if (feedback !== undefined) {
      application.feedback = feedback;
    }
    
    await application.save();
    
    // If status changed, create notification for the applicant
    if (status !== previousStatus) {
      const applicantId = application.applicant.toString();
      
      // Get project info for notification
      const project = await Project.findById(application.project);
      
      if (project) {
        let message = '';
        let type: 'info' | 'success' | 'warning' | 'error' = 'info';
        
        if (status === 'accepted') {
          message = `Your application for "${project.title}" has been accepted!`;
          type = 'success';
        } else if (status === 'rejected') {
          message = `Your application for "${project.title}" has been rejected.`;
          type = 'warning';
        } else {
          message = `Your application for "${project.title}" status has been updated to ${status}.`;
        }
        
        const notification = await createNotification(
          applicantId,
          message,
          type,
          {
            model: 'Application',
            id: applicationId,
          }
        );
        
        // Send real-time notification
        sendNotificationToUser(applicantId, notification);
      }
    }
    
    res.status(200).json({
      success: true,
      data: application,
      message: 'Application updated successfully',
    });
  } catch (error) {
    console.error('Error in updateApplication:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Submit project work
 * @route PUT /api/applications/:id/submit
 * @access Private (Application owner)
 */
export const submitWork = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }
    
    const applicationId = req.params.id;
    const userId = req.user.userId;
    
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid application ID',
      });
      return;
    }
    
    // Get application
    const application = await Application.findById(applicationId)
      .populate('applicant');
    
    if (!application) {
      res.status(404).json({
        success: false,
        error: 'Application not found',
      });
      return;
    }
    
    // Check if user is the applicant
    const applicantId = (application.applicant as any)._id.toString();
    
    if (userId !== applicantId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to submit work for this application',
      });
      return;
    }
    
    // Check if application is accepted
    if (application.status !== 'accepted') {
      res.status(400).json({
        success: false,
        error: 'Can only submit work for accepted applications',
      });
      return;
    }
    
    // Update application
    const { submissionLink } = req.body;
    
    application.submissionLink = submissionLink;
    
    await application.save();
    
    res.status(200).json({
      success: true,
      data: application,
      message: 'Work submitted successfully',
    });
  } catch (error) {
    console.error('Error in submitWork:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Delete application
 * @route DELETE /api/applications/:id
 * @access Admin
 */
export const deleteApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const applicationId = req.params.id;
    
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid application ID',
      });
      return;
    }
    
    const application = await Application.findById(applicationId);
    
    if (!application) {
      res.status(404).json({
        success: false,
        error: 'Application not found',
      });
      return;
    }
    
    // Remove application from user's applications
    await User.findByIdAndUpdate(application.applicant, {
      $pull: { applications: applicationId },
    });
    
    // Remove application from project's applications
    await Project.findByIdAndUpdate(application.project, {
      $pull: { applications: applicationId },
    });
    
    // Remove application
    await application.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteApplication:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
}; 