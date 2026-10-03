import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  AnalyticsFiltersSchema,
  AnalyticsFilters,
} from '../validators/analytics.validator';
import * as analyticsService from '../services/analytics.service';

function handleZodError(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

function parseFilters(req: Request): AnalyticsFilters {
  const validated = AnalyticsFiltersSchema.parse(req.query);
  return {
    dateFrom: validated.dateFrom,
    dateTo: validated.dateTo,
    clientId: validated.clientId,
    campaignId: validated.campaignId,
  };
}

export async function getDashboardStats(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const filters = parseFilters(req);
    const stats = await analyticsService.getDashboardStats(filters);

    res.status(200).json({
      success: true,
      data: stats,
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
      error instanceof Error ? error.message : 'Failed to fetch dashboard stats';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function getCampaignPerformance(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const filters = parseFilters(req);
    const performance = await analyticsService.getCampaignPerformance(filters);

    res.status(200).json({
      success: true,
      data: performance,
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
      error instanceof Error
        ? error.message
        : 'Failed to fetch campaign performance';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function getLeadTrends(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const filters = parseFilters(req);
    const trends = await analyticsService.getLeadTrends(filters);

    res.status(200).json({
      success: true,
      data: trends,
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
      error instanceof Error ? error.message : 'Failed to fetch lead trends';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function getRevenueStats(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const filters = parseFilters(req);
    const revenue = await analyticsService.getRevenueStats(filters);

    res.status(200).json({
      success: true,
      data: revenue,
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
      error instanceof Error ? error.message : 'Failed to fetch revenue stats';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function getClientGrowth(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const filters = parseFilters(req);
    const growth = await analyticsService.getClientGrowth(filters);

    res.status(200).json({
      success: true,
      data: growth,
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
      error instanceof Error ? error.message : 'Failed to fetch client growth';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function getLeadStatusDistribution(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const filters = parseFilters(req);
    const distribution = await analyticsService.getLeadStatusDistribution(filters);

    res.status(200).json({
      success: true,
      data: distribution,
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
      error instanceof Error
        ? error.message
        : 'Failed to fetch lead status distribution';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}
