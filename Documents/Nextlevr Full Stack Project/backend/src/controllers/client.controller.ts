import { Request, Response } from 'express';
import * as clientService from '../services/client.service';
import {
  CreateClientSchema,
  UpdateClientSchema,
  ClientFiltersSchema,
} from '../validators/client.validator';
import { ZodError } from 'zod';

function handleZodError(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

export async function getClients(req: Request, res: Response): Promise<void> {
  try {
    const validatedFilters = ClientFiltersSchema.parse(req.query);

    // Remove undefined keys
    const cleanFilters = Object.fromEntries(
      Object.entries(validatedFilters).filter(([_, v]) => v !== undefined)
    );

    const result = await clientService.getClients(cleanFilters);

    res.status(200).json({
      success: true,
      data: result.clients,
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

    const message = error instanceof Error ? error.message : 'Failed to fetch clients';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function getClientById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const client = await clientService.getClientById(id);

    if (!client) {
      res.status(404).json({
        success: false,
        error: 'Client not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch client';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function createClient(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = CreateClientSchema.parse(req.body);
    const client = await clientService.createClient(validatedData, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client,
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

    const message = error instanceof Error ? error.message : 'Failed to create client';
    const statusCode = message.includes('already exists') ? 409 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function updateClient(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const validatedData = UpdateClientSchema.parse(req.body);

    if (Object.keys(validatedData).length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields provided for update',
      });
      return;
    }

    const client = await clientService.updateClient(id, validatedData, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: client,
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

    const message = error instanceof Error ? error.message : 'Failed to update client';
    const statusCode = message === 'Client not found' ? 404
      : message.includes('already exists') ? 409
      : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function deleteClient(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Fetch client before deletion for activity log
    const client = await clientService.getClientById(id);

    if (!client) {
      res.status(404).json({
        success: false,
        error: 'Client not found',
      });
      return;
    }

    await clientService.deleteClient(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete client';
    const statusCode = message === 'Client not found' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function getIndustries(_req: Request, res: Response): Promise<void> {
  try {
    const industries = await clientService.getDistinctIndustries();

    res.status(200).json({
      success: true,
      data: industries,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch industries';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function getClientCampaigns(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const client = await clientService.getClientById(id);
    if (!client) {
      res.status(404).json({
        success: false,
        error: 'Client not found',
      });
      return;
    }

    const campaigns = await clientService.getClientCampaigns(id);

    res.status(200).json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch campaigns';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}