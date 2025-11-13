import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  CreateServiceSchema, 
  CreateBookingSchema, 
  UpdateBookingStatusSchema,
  CreateReviewSchema,
  ServiceSearchSchema
} from '@wakili-pro/shared/src/schemas/marketplace';
import { z } from 'zod';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate lawyer profile exists
    const lawyer = await prisma.user.findUnique({
      where: { id: userId },
      include: { lawyerProfile: true }
    });

    if (!lawyer?.lawyerProfile) {
      return res.status(400).json({
        success: false,
        message: 'Lawyer profile required to create services'
      });
    }

    const validatedData = CreateServiceSchema.parse(req.body);

    const service = await prisma.marketplaceService.create({
      data: {
        ...validatedData,
        providerId: userId,
        type: validatedData.type,
      },
      include: {
        provider: {
          select: {
            firstName: true,
            lastName: true,
            // profilePicture: true // TODO: Add to User model,
            lawyerProfile: {
              select: {
                rating: true,
                reviewCount: true,
                specializations: true,
                location: true,
                isVerified: true,
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getMyServices = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const services = await prisma.marketplaceService.findMany({
      where: { providerId: userId },
      include: {
        provider: {
          select: {
            firstName: true,
            lastName: true,
            // profilePicture: true // TODO: Add to User model,
            lawyerProfile: {
              select: {
                rating: true,
                reviewCount: true,
                specializations: true,
                location: true,
                isVerified: true,
              }
            }
          }
        },
        _count: {
          select: {
            bookings: true,
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: services
    });

  } catch (error) {
    console.error('Get my services error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const serviceId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify ownership
    const existingService = await prisma.marketplaceService.findUnique({
      where: { id: serviceId }
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (existingService.providerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this service'
      });
    }

    const validatedData = CreateServiceSchema.partial().parse(req.body);

    const updatedService = await prisma.marketplaceService.update({
      where: { id: serviceId },
      data: {
        ...validatedData,
        ...(validatedData.type && { type: validatedData.type })
      },
      include: {
        provider: {
          select: {
            firstName: true,
            lastName: true,
            // profilePicture: true // TODO: Add to User model,
            lawyerProfile: {
              select: {
                rating: true,
                reviewCount: true,
                specializations: true,
                location: true,
                isVerified: true,
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedService,
      message: 'Service updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const serviceId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify ownership
    const existingService = await prisma.marketplaceService.findUnique({
      where: { id: serviceId }
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (existingService.providerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this service'
      });
    }

    await prisma.marketplaceService.delete({
      where: { id: serviceId }
    });

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const searchServices = async (req: Request, res: Response) => {
  try {
    const validatedParams = ServiceSearchSchema.parse(req.query);
    const { query, type, location, priceMin, priceMax, rating, page, limit } = validatedParams;

    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      status: "ACTIVE"
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      where.priceKES = {};
      if (priceMin !== undefined) where.priceKES.gte = priceMin;
      if (priceMax !== undefined) where.priceKES.lte = priceMax;
    }

    // Location-based search (if provided)
    if (location) {
      // This would require geographic search capabilities
      // For now, we'll implement a basic location filter
      where.provider = {
        lawyerProfile: {
          location: {
            path: ['latitude'],
            // You would implement proper geographic distance calculation here
          }
        }
      };
    }

    // Rating filter
    if (rating) {
      where.provider = {
        ...where.provider,
        lawyerProfile: {
          ...where.provider?.lawyerProfile,
          rating: { gte: rating }
        }
      };
    }

    const [services, total] = await Promise.all([
      prisma.marketplaceService.findMany({
        where,
        include: {
          provider: {
            select: {
              firstName: true,
              lastName: true,
              // profilePicture: true // TODO: Add to User model,
              lawyerProfile: {
                select: {
                  rating: true,
                  reviewCount: true,
                  specializations: true,
                  location: true,
                  isVerified: true,
                }
              }
            }
          },
          _count: {
            select: {
              bookings: true,
              reviews: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: [
          { provider: { lawyerProfile: { rating: 'desc' } } },
          { createdAt: 'desc' }
        ]
      }),
      prisma.marketplaceService.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        services,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid search parameters',
        errors: error.errors
      });
    }

    console.error('Search services error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getService = async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.id;

    const service = await prisma.marketplaceService.findUnique({
      where: { 
        id: serviceId,
        status: "ACTIVE" 
      },
      include: {
        provider: {
          select: {
            firstName: true,
            lastName: true,
            // profilePicture: true // TODO: Add to User model,
            lawyerProfile: {
              select: {
                rating: true,
                reviewCount: true,
                specializations: true,
                location: true,
                isVerified: true,
                bio: true,
                // credentials: true // TODO: Add to LawyerProfile
              }
            }
          }
        },
        reviews: {
          include: {
            author: {
              select: {
                firstName: true,
                lastName: true,
                // profilePicture: true // TODO: Add to User model
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            bookings: true,
            reviews: true
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });

  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const validatedData = CreateBookingSchema.parse(req.body);
    
    // Get service details
    const service = await prisma.marketplaceService.findUnique({
      where: { id: validatedData.serviceId }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (service.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: 'Service is not available for booking'
      });
    }

    // Prevent self-booking
    if (service.providerId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book your own service'
      });
    }

    const booking = await prisma.serviceBooking.create({
      data: {
        serviceId: validatedData.serviceId,
        clientId: userId,
        providerId: service.providerId,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        clientRequirements: validatedData.clientRequirements,
        totalAmountKES: service.priceKES,
        status: 'PENDING',
        paymentStatus: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const bookings = await prisma.serviceBooking.findMany({
      where: {
        OR: [
          { clientId: userId },
          { providerId: userId }
        ]
      },
      include: {
        service: {
          select: {
            title: true,
            type: true,
            priceKES: true
          }
        },
        client: {
          select: {
            firstName: true,
            lastName: true,
            // profilePicture: true // TODO: Add to User model
          }
        },
        provider: {
          select: {
            firstName: true,
            lastName: true,
            // profilePicture: true // TODO: Add to User model
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const bookingId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const validatedData = UpdateBookingStatusSchema.parse(req.body);
    
    // Verify booking exists and user is the provider
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.providerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    const updatedBooking = await prisma.serviceBooking.update({
      where: { id: bookingId },
      data: {
        status: validatedData.status,
        providerNotes: validatedData.providerNotes
      }
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking status updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const validatedData = CreateReviewSchema.parse(req.body);
    
    // Verify user has completed booking for this service
    const completedBooking = await prisma.serviceBooking.findFirst({
      where: {
        serviceId: validatedData.serviceId,
        clientId: userId,
        status: 'COMPLETED'
      }
    });

    if (!completedBooking) {
      return res.status(400).json({
        success: false,
        message: 'Can only review services you have completed bookings for'
      });
    }

    // Get the service to find the provider
    const service = await prisma.marketplaceService.findUnique({
      where: { id: validatedData.serviceId }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if review already exists
    const existingReview = await prisma.serviceReview.findFirst({
      where: {
        serviceId: validatedData.serviceId,
        authorId: userId
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this service'
      });
    }

    const review = await prisma.serviceReview.create({
      data: {
        serviceId: validatedData.serviceId,
        authorId: userId,
        targetId: service.providerId,
        rating: validatedData.rating,
        comment: validatedData.comment
      }
    });

    // Update lawyer's overall rating
    await updateLawyerRating(completedBooking.providerId);

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getServiceReviews = async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.id;

    const reviews = await prisma.serviceReview.findMany({
      where: { serviceId },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            // profilePicture: true // TODO: Add to User model
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error('Get service reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to update lawyer's overall rating
async function updateLawyerRating(providerId: string) {
  try {
    const reviewStats = await prisma.serviceReview.aggregate({
      where: {
        service: {
          providerId: providerId
        }
      },
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    });

    await prisma.lawyerProfile.update({
      where: { userId: providerId },
      data: {
        rating: reviewStats._avg.rating || 0,
        reviewCount: reviewStats._count.id
      }
    });
  } catch (error) {
    console.error('Update lawyer rating error:', error);
  }
}
