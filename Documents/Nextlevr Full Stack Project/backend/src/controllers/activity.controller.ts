import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as activityService from '../services/activity.service';
import { ActivityFiltersSchema } from '../validators/activity.validator';

function handleZodError(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

export async function getActivities(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validatedFilters = ActivityFiltersSchema.parse(req.query);

    const activities = await activityService.getActivities({
      userId: req.user.id,
      entityType: validatedFilters.entityType,
      entityId: validatedFilters.entityId,
      action: validatedFilters.action,
      limit: validatedFilters.limit,
      offset: validatedFilters.offset,
    });

    res.status(200).json({
      success: true,
      data: activities,
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
      error instanceof Error ? error.message : 'Failed to fetch activities';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}
