import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as notificationService from '../services/notification.service';
import { NotificationIdParamSchema } from '../validators/notification.validator';

function handleZodError(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

export async function getNotifications(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const notifications = await notificationService.getNotifications(
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch notifications';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function markAsRead(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = NotificationIdParamSchema.parse(req.params);

    const notification = await notificationService.getNotificationById(id);
    if (!notification || notification.userId !== req.user.id) {
      res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
      return;
    }

    const updated = await notificationService.markAsRead(id);

    res.status(200).json({
      success: true,
      data: updated,
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
        : 'Failed to mark notification as read';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function markAllAsRead(
  req: Request,
  res: Response
): Promise<void> {
  try {
    await notificationService.markAllAsRead(req.user.id);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to mark all notifications as read';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}
