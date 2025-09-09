import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { z } from "zod";

const packageSchema = z.object({
  name: z.string().min(1, "Package name is required"),
  description: z.string().min(1, "Package description is required"),
  price: z.number().positive("Price must be positive"),
  currency: z.string().default("USD"),
  features: z.array(z.string()).optional().default([]),
  duration: z.string().optional(),
  isActive: z.boolean().default(true),
  category: z.string().optional(),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const input = packageSchema.parse(body);

    const packageData = await prisma.package.create({
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        currency: input.currency,
        features: JSON.stringify(input.features),
        duration: input.duration,
        isActive: input.isActive,
        category: input.category,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Package created successfully",
      package: {
        ...packageData,
        features: JSON.parse(packageData.features),
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating package:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const isActive = searchParams.get('isActive');

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) {
      where.category = category;
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const packages = await prisma.package.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    // Parse features JSON for each package
    const packagesWithParsedFeatures = packages.map(pkg => ({
      ...pkg,
      features: JSON.parse(pkg.features || '[]'),
    }));

    return NextResponse.json({
      success: true,
      count: packagesWithParsedFeatures.length,
      packages: packagesWithParsedFeatures,
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
