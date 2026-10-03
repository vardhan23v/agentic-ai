import { Request, Response } from 'express';
import * as campaignService from '../services/campaign.service';
import {
  CreateCampaignSchema,
  UpdateCampaignSchema,
  CampaignFiltersSchema,
} from '../validators/campaign.validator';
import { ZodError } from 'zod';

function handleZodError(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

export async function getCampaigns(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validatedFilters = CampaignFiltersSchema.parse(req.query);

    const cleanFilters = Object.fromEntries(
      Object.entries(validatedFilters).filter(([_, v]) => v !== undefined)
    );

    const result = await campaignService.getCampaigns(cleanFilters);

    res.status(200).json({
      success: true,
      data: result.campaigns,
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
      error instanceof Error ? error.message : 'Failed to fetch campaigns';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function getCampaignById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;
    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch campaign';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function createCampaign(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validatedData = CreateCampaignSchema.parse(req.body);
    const campaign = await campaignService.createCampaign(validatedData, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign,
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
      error instanceof Error ? error.message : 'Failed to create campaign';
    const statusCode = message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function updateCampaign(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;
    const validatedData = UpdateCampaignSchema.parse(req.body);

    if (Object.keys(validatedData).length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields provided for update',
      });
      return;
    }

    const campaign = await campaignService.updateCampaign(id, validatedData, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign,
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
      error instanceof Error ? error.message : 'Failed to update campaign';
    const statusCode =
      message === 'Campaign not found' || message.includes('not found')
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

export async function deleteCampaign(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;

    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
      return;
    }

    await campaignService.deleteCampaign(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete campaign';
    const statusCode = message === 'Campaign not found' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function getMyCampaigns(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const campaigns = await campaignService.getCampaignsForTeamMember(
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch campaigns';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}