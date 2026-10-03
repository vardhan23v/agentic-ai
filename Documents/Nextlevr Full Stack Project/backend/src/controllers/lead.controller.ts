import { Request, Response } from 'express';
import * as leadService from '../services/lead.service';
import {
  CreateLeadSchema,
  UpdateLeadSchema,
  UpdateLeadStatusSchema,
  LeadFiltersSchema,
} from '../validators/lead.validator';
import { ZodError } from 'zod';

function handleZodError(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

export async function getLeads(req: Request, res: Response): Promise<void> {
  try {
    const validatedFilters = LeadFiltersSchema.parse(req.query);

    const cleanFilters = Object.fromEntries(
      Object.entries(validatedFilters).filter(([_, v]) => v !== undefined)
    );

    const result = await leadService.getLeads(cleanFilters);

    res.status(200).json({
      success: true,
      data: result.leads,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: handleZodError(error),
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : 'Failed to fetch leads';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function getLeadById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const lead = await leadService.getLeadById(id);

    if (!lead) {
      res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch lead';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function createLead(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = CreateLeadSchema.parse(req.body);
    const lead = await leadService.createLead(validatedData, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: handleZodError(error),
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : 'Failed to create lead';
    const statusCode = message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function updateLead(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const validatedData = UpdateLeadSchema.parse(req.body);

    if (Object.keys(validatedData).length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields provided for update',
      });
      return;
    }

    // Fetch existing lead to detect changes for notifications
    const existingLead = await leadService.getLeadById(id);
    if (!existingLead) {
      res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
      return;
    }

    const lead = await leadService.updateLead(id, validatedData, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: lead,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: handleZodError(error),
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : 'Failed to update lead';
    const statusCode =
      message === 'Lead not found' || message.includes('not found')
        ? 404
        : message.includes('Invalid status transition')
          ? 422
          : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function updateLeadStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { status } = UpdateLeadStatusSchema.parse(req.body);

    const existingLead = await leadService.getLeadById(id);
    if (!existingLead) {
      res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
      return;
    }

    const lead = await leadService.updateLead(id, { status }, req.user.id);

    const statusLabel = status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

    res.status(200).json({
      success: true,
      message: `Lead status updated to ${statusLabel}`,
      data: lead,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: handleZodError(error),
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : 'Failed to update lead status';
    const statusCode = message.includes('Invalid status transition')
      ? 422
      : message.includes('not found')
        ? 404
        : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function deleteLead(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const lead = await leadService.getLeadById(id);

    if (!lead) {
      res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
      return;
    }

    await leadService.deleteLead(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete lead';
    const statusCode = message === 'Lead not found' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function getPipeline(_req: Request, res: Response): Promise<void> {
  try {
    const pipeline = await leadService.getLeadsByStatus();

    res.status(200).json({
      success: true,
      data: pipeline,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch pipeline';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function getSources(_req: Request, res: Response): Promise<void> {
  try {
    const sources = await leadService.getDistinctSources();

    res.status(200).json({
      success: true,
      data: sources,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch sources';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}