import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { z } from "zod";

const updatePackageSchema = z.object({
  name: z.string().min(1, "Package name is required").optional(),
  description: z.string().min(1, "Package description is required").optional(),
  price: z.number().positive("Price must be positive").optional(),
  currency: z.string().optional(),
  features: z.array(z.string()).optional(),
  duration: z.string().optional(),
  isActive: z.boolean().optional(),
  category: z.string().optional(),
});

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const packageId = parseInt(id);

    if (isNaN(packageId)) {
      return NextResponse.json({ error: "Invalid package ID" }, { status: 400 });
    }

    const packageData = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!packageData) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      package: {
        ...packageData,
        features: JSON.parse(packageData.features || '[]'),
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching package:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const packageId = parseInt(id);

    if (isNaN(packageId)) {
      return NextResponse.json({ error: "Invalid package ID" }, { status: 400 });
    }

    const body = await req.json();
    const input = updatePackageSchema.parse(body);

    // Check if package exists
    const existingPackage = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData = { ...input };
    if (input.features) {
      updateData.features = JSON.stringify(input.features);
    }

    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Package updated successfully",
      package: {
        ...updatedPackage,
        features: JSON.parse(updatedPackage.features || '[]'),
      },
    }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating package:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const packageId = parseInt(id);

    if (isNaN(packageId)) {
      return NextResponse.json({ error: "Invalid package ID" }, { status: 400 });
    }

    // Check if package exists
    const existingPackage = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    await prisma.package.delete({
      where: { id: packageId },
    });

    return NextResponse.json({
      success: true,
      message: "Package deleted successfully",
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting package:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
